# @hive/template-service

Manages Handlebars templates with versioning and per-org slot overrides. Used by the notification service (and any future consumer) to render typed template content before sending.

---

## What this service owns

- **System templates** — global defaults keyed by a dot-notation `key` (e.g. `auth.email.verification`)
- **Org template overrides** — per-org partial slot overrides merged on top of system templates at render time (org slots win on conflict, missing org slots fall back to system)
- **Version history** — every update snapshots the previous state into an immutable version row; any past version can be reverted to at any time
- **Handlebars rendering** — `RenderTemplate` resolves the correct template, merges org overrides, compiles all slots with caller-supplied variables, and returns rendered output

---

## Architecture

Dual transport: **HTTP** (health/status only) + **gRPC** (all template operations).

Consumers never call this service over HTTP. They use the injectable `HiveTemplateClientService` from `@hive/template`.

```
Caller (notification-service, etc.)
  → HiveTemplateClientService (gRPC client from @hive/template)
  → template-service
      → PostgreSQL (templates, versions, org overrides)
```

---

## Core concepts

### Slots

A template stores its content as a flat map of named strings called **slots**. Each slot is a Handlebars template string.

```json
{
  "email_subject": "Verify your email address",
  "email_body": "<p>Hi {{user.firstName}}, please click <a href=\"{{actionUrl}}\">here</a>.</p>",
  "sms_body": "Verify your account: {{actionUrl}}"
}
```

Slot names are open — any string is valid. The notification service defines its own contract (see [Slot naming convention](#slot-naming-convention-notification-templates)). Other consumers (AI prompts, reports, invoices) define different names.

### System templates vs org overrides

There is one system template per `key`. Orgs do not own copies of system templates — they own **override records** that store only the slots they changed. At render time, the service merges the two:

```
rendered = { ...systemSlots, ...orgOverrideSlots }
```

Org slots win on conflict. Any slot not present in the org override falls back to the system default. If an org has no override at all, the system template is used as-is.

### Rendering pipeline

```
RenderTemplate(key, organizationId?, variables)

  1. Check in-memory cache (key + orgId, 5-min TTL)
     → hit: skip DB reads
     → miss: continue

  2. Fetch system Template by key from DB
     → not found or voided → NOT_FOUND error

  3. If organizationId provided:
       Fetch OrgTemplateOverride for (key, orgId)
       → may be null (org has no customization)

  4. Cache the resolved (template, override) pair

  5. Merge slots:
       mergedSlots = { ...systemSlots, ...orgOverrideSlots }

  6. Merge metadata:
       mergedMetadata = { ...systemMetadata, ...orgOverrideMetadata }

  7. For each slot in mergedSlots:
       compiledFn = compileCache.get(slotString) ?? Handlebars.compile(slotString)
       renderedSlots[name] = compiledFn(variables, { allowProtoProperties: false })

  8. Return { renderedSlots, metadata }
```

**Caches involved:**

- **Resolution cache** — the `(template, override)` DB result is cached in memory per `key:orgId` for 5 minutes. Invalidated on any mutation to that template or override.
- **Compile cache** — compiled Handlebars template functions are cached per slot string (max 500 entries, LRU eviction). Avoids re-parsing the Handlebars AST on every render call.

### Versioning

Every mutating operation that changes a template's content (`UpdateTemplate`, `RevertTemplate`) or an org override's content (`UpsertOrgOverride`, `RevertOrgOverride`) first snapshots the **current state** into an immutable version row before applying changes. The snapshot and the update happen inside a single database transaction — if the update fails, no orphaned version is created.

```
Update Template A (version 3 → 4):
  DB transaction:
    INSERT TemplateVersion { templateId: A, version: 3, slots: <current> }
    UPDATE Template        { version: 4, slots: <new> }
```

Reverting to a past version is itself a forward-only operation: the current state is snapshotted first, then the target version's content is applied as a new version. No version is ever deleted.

```
Revert Template A to version 2 (currently at version 4):
  DB transaction:
    INSERT TemplateVersion { templateId: A, version: 4, slots: <current> }  ← current snapshotted
    UPDATE Template        { version: 5, slots: <version-2 content> }
```

---

## Environment variables

Create a `.env` file in this directory:

| Variable                     | Description                               | Required |
| ---------------------------- | ----------------------------------------- | -------- |
| `DATABASE_URL`               | PostgreSQL connection string              | Yes      |
| `REGISTRY_SERVICE_URL`       | URL of the registry service               | Yes      |
| `SERVICE_NAME`               | Service name registered in the registry   | Yes      |
| `SERVICE_VERSION`            | Service version                           | Yes      |
| `PORT`                       | HTTP server port (`0` = random free port) | No       |
| `TEMPLATE_GRPC_SERVICE_PORT` | gRPC server port (`0` = random free port) | No       |

---

## First-time setup

```bash
pnpm install

# 1. Create the database and run migrations (interactive — prompts for a migration name)
pnpm db:migrate

# 2. Regenerate Prisma client
pnpm db:generate

# 3. Seed system default templates
pnpm db:seed

# 4. Start in watch mode
pnpm dev
```

---

## Adding a new system template

System templates are defined in two places:

```
prisma/seeds/
├── templates.csv              ← one row per template (metadata + slot sources)
└── templates/
    └── <key>/
        └── <slot_name>.hbs    ← Handlebars file for large slots
```

### Step 1 — Add a row to `templates.csv`

| Column        | Value                                                                        |
| ------------- | ---------------------------------------------------------------------------- |
| `key`         | Dot-notation key, e.g. `billing.invoice.sent`                                |
| `type`        | Consumer category: `notification`, `prompt`, `report`, `invoice`, `document` |
| `name`        | Human-readable display name                                                  |
| `description` | What this template is used for                                               |
| `engine`      | Always `HANDLEBARS` for now                                                  |
| `slot_*`      | Source directive — see below                                                 |
| `schema`      | JSON Schema for required/optional slots (optional)                           |
| `metadata`    | Type-specific config JSON (optional)                                         |

**Slot source directives** — each `slot_*` cell value:

| Directive              | Usage                                                        |
| ---------------------- | ------------------------------------------------------------ |
| `text:<value>`         | Short inline content — subjects, SMS one-liners, push titles |
| `file:<relative-path>` | Path to a `.hbs` file relative to `prisma/seeds/`            |
| _(empty)_              | Slot is excluded from this template                          |

Example row:

```csv
billing.invoice.sent,notification,Invoice Sent,Sent when a new invoice is issued.,HANDLEBARS,text:Your invoice #{{invoice.number}} is ready,file:templates/billing.invoice.sent/email_body.hbs,text:Invoice #{{invoice.number}} from {{orgName}}.,,,"{""required"":[""email_subject"",""email_body""]}","{""channels"":{""email"":true}}"
```

### Step 2 — Create `.hbs` files for large slots

For any `file:` slot, create the file under `prisma/seeds/templates/<key>/`:

```
prisma/seeds/templates/billing.invoice.sent/
└── email_body.hbs
```

`.hbs` files are plain Handlebars templates:

```html
<p>Hi {{user.firstName}},</p>

<p>
  Your invoice <strong>#{{invoice.number}}</strong> for
  <strong>{{invoice.amount}}</strong> is ready.
</p>

<p><a href="{{invoiceUrl}}">View Invoice</a></p>
```

### Step 3 — Run the seed

```bash
pnpm db:seed
```

The seed upserts — running it again updates existing templates without duplicating them.

---

## Slot naming convention (notification templates)

Slots are open strings — any name is valid. The following are the shared contract with the notification service:

| Slot            | Content                                                    |
| --------------- | ---------------------------------------------------------- |
| `email_subject` | Email subject line (plain text, Handlebars)                |
| `email_body`    | Email HTML body (Handlebars)                               |
| `sms_body`      | SMS message text, 160-char target (plain text, Handlebars) |
| `push_title`    | Push notification title (plain text, Handlebars)           |
| `push_body`     | Push notification body text (plain text, Handlebars)       |

---

## System default templates

| Key                       | Slots                                                                | Description                                       |
| ------------------------- | -------------------------------------------------------------------- | ------------------------------------------------- |
| `auth.email.verification` | `email_subject`, `email_body`                                        | Email sent on signup requiring email verification |
| `auth.password.reset`     | `email_subject`, `email_body`, `sms_body`                            | Email + SMS sent on password reset request        |
| `org.invitation`          | `email_subject`, `email_body`                                        | Email sent when a user is invited to an org       |
| `org.welcome`             | `email_subject`, `email_body`, `sms_body`, `push_title`, `push_body` | Full multi-channel welcome on joining an org      |

---

## Org-level template customization

Orgs override only the slots they want to change. The system template provides the rest. This means an org can rebrand the subject line without touching the email body, or swap the full body while keeping the system subject.

**Create or update an org's override** (`HiveTemplateClientService.orgOverrides.upsertOrgOverride`):

```typescript
// Only email_subject is overridden — email_body falls back to the system default
await templateClient.orgOverrides
  .upsertOrgOverride({
    templateKey: 'auth.email.verification',
    organizationId: 'org-123',
    slots: JSON.stringify({
      email_subject: 'Verify your Acme account',
    }),
    metadata: JSON.stringify({ fromName: 'Acme Support' }),
    changeNote: 'Initial brand customization',
  })
  .toPromise();
```

**What render returns for that org:**

```json
{
  "renderedSlots": {
    "email_subject": "Verify your Acme account",   ← org override
    "email_body": "<p>Hi Alice, please click …</p>" ← system default, compiled with variables
  },
  "metadata": "{\"channels\":{\"email\":true},\"fromName\":\"Acme Support\"}"
}
```

**Calling RenderTemplate from another service:**

```typescript
const result = await templateClient.render
  .renderTemplate({
    key: 'auth.email.verification',
    organizationId: session.activeOrganizationId, // omit for system default only
    variables: JSON.stringify({
      user: { firstName: 'Alice' },
      actionUrl: 'https://app.thehive.com/verify?token=abc123',
    }),
  })
  .toPromise();

const subject = result.renderedSlots['email_subject'];
const body = result.renderedSlots['email_body'];
```

---

## Cache behaviour

| Cache            | Key                        | TTL                    | Invalidated by                            |
| ---------------- | -------------------------- | ---------------------- | ----------------------------------------- |
| Resolution cache | `key` or `key:orgId`       | 5 minutes              | Any mutation to that template or override |
| Compile cache    | Handlebars template string | Forever (LRU, max 500) | Never (content-addressed)                 |

The resolution cache is **in-memory per instance**. If you run multiple instances, each has its own cache. In a multi-instance setup, a mutation on one instance invalidates that instance's cache only — other instances serve stale data for up to 5 minutes. This is acceptable for template content (changes are infrequent and content is not security-sensitive). If stricter consistency is needed, reduce `RENDER_CACHE_TTL_MS` or replace with a shared Redis cache.

---

## gRPC API surface

All operations are exposed via the `Templates` gRPC service. The client is `HiveTemplateClientService` from `@hive/template`, grouped into three namespaces:

| Namespace       | Methods                                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `.templates`    | `createTemplate`, `getTemplate`, `updateTemplate`, `deleteTemplate`, `listTemplates`, `listTemplateVersions`, `revertTemplate` |
| `.orgOverrides` | `upsertOrgOverride`, `getOrgOverride`, `deleteOrgOverride`, `listOrgOverrides`, `listOrgOverrideVersions`, `revertOrgOverride` |
| `.render`       | `renderTemplate`                                                                                                               |

Error codes returned:

| Code               | When                                                            |
| ------------------ | --------------------------------------------------------------- |
| `NOT_FOUND`        | Template or version or override does not exist                  |
| `INVALID_ARGUMENT` | Required field missing, invalid JSON, version/override mismatch |
| `ALREADY_EXISTS`   | `createTemplate` with a key that already exists                 |
| `INTERNAL`         | Handlebars compilation failure                                  |

---

## Proto generation

After changing any `.proto` file in `packages/template/src/proto/`:

```bash
pnpm --filter @hive/template gen
```

This regenerates TypeScript types in `packages/template/src/types/` and copies proto files to `dist/proto/`. Rebuild dependent services after.

---

## Schema changes

```bash
# Edit prisma/schema.prisma, then:
pnpm db:migrate     # create and apply migration (interactive — enter a name)
pnpm db:generate    # regenerate Prisma client
```

---

## Testing

```bash
pnpm test       # unit tests
pnpm test:e2e   # end-to-end tests
```

Test coverage:

- `templates.renderer.spec.ts` — slot merge, Handlebars compile, org override wins, prototype pollution prevention, parse helpers
- `templates.service.spec.ts` — CRUD, transactional snapshotting, revert, render with and without org override, soft vs hard delete
