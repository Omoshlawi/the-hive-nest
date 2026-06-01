# @hive/template-service

Manages Handlebars templates with versioning and per-org slot overrides. Used by the notification service (and any future consumer) to render typed template content before sending.

---

## What this service owns

- **System templates** — global defaults keyed by a dot-notation `key` (e.g. `auth.email.verification`)
- **Org template overrides** — per-org partial slot overrides merged on top of system templates at render time (org slots win on conflict)
- **Version history** — every update snapshots the previous state; any past version can be reverted to at any time
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

### Rendering flow

```
RenderTemplate(key, organizationId?, variables)
  1. Load Template by key
  2. If organizationId is given → load OrgTemplateOverride (if exists)
  3. Merge: { ...systemSlots, ...orgOverrideSlots }   ← org wins on conflict
  4. Compile each merged slot with Handlebars(variables)
  5. Return { renderedSlots: { slotName: "compiled string" }, metadata }
```

---

## Environment variables

Create a `.env` file in this directory (see `.env.example` if present):

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

System templates are defined in two places and kept in sync manually:

```
prisma/seeds/
├── templates.csv              ← one row per template (metadata + slot sources)
└── templates/
    └── <key>/
        └── <slot_name>.hbs    ← Handlebars file for each large slot
```

### Step 1 — Add a row to `templates.csv`

Each column follows this convention:

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

**Slot source directives** (the `slot_*` columns):

| Directive              | Usage                                                        |
| ---------------------- | ------------------------------------------------------------ |
| `text:<value>`         | Short inline content — subjects, SMS one-liners, push titles |
| `file:<relative-path>` | Path to a `.hbs` file relative to `prisma/seeds/`            |
| _(empty)_              | Slot is excluded from this template                          |

Example row:

```csv
billing.invoice.sent,notification,Invoice Sent,Sent when a new invoice is issued.,HANDLEBARS,text:Your invoice #{{invoice.number}} is ready,file:templates/billing.invoice.sent/email_body.hbs,text:Invoice #{{invoice.number}} from {{orgName}} is ready.,,,"{"required":["email_subject","email_body"]}","{"channels":{"email":true,"sms":true,"push":false}}"
```

### Step 2 — Create `.hbs` files for large slots

For any slot using `file:`, create the corresponding file under `prisma/seeds/templates/<key>/`:

```
prisma/seeds/templates/billing.invoice.sent/
└── email_body.hbs
```

`.hbs` files are plain Handlebars templates. Use `{{variable}}` syntax — whatever the caller passes in `variables` becomes available.

```html
<p>Hi {{user.firstName}},</p>

<p>
  Your invoice <strong>#{{invoice.number}}</strong> for
  <strong>{{invoice.amount}}</strong> is ready.
</p>

<p>
  <a href="{{invoiceUrl}}">View Invoice</a>
</p>
```

### Step 3 — Run the seed

```bash
pnpm db:seed
```

The seed upserts — running it again updates existing templates without duplicating them.

---

## Slot naming convention (notification templates)

Slots are open strings — any name is valid. The following names are the shared contract with the notification service:

| Slot            | Content                                                    |
| --------------- | ---------------------------------------------------------- |
| `email_subject` | Email subject line (plain text, Handlebars)                |
| `email_body`    | Email HTML body (Handlebars)                               |
| `sms_body`      | SMS message text, 160-char target (plain text, Handlebars) |
| `push_title`    | Push notification title (plain text, Handlebars)           |
| `push_body`     | Push notification body (plain text, Handlebars)            |

Other consumer types (AI prompts, reports, invoices) define their own slot names.

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

Orgs can override specific slots without replacing the whole template. Only the changed slots need to be stored — the rest fall back to system defaults at render time.

**Via gRPC** (`HiveTemplateClientService.orgOverrides`):

```typescript
// Create or update an org's override for a template
await templateClient.orgOverrides.upsertOrgOverride({
  templateKey: 'auth.email.verification',
  organizationId: 'org-123',
  slots: JSON.stringify({
    email_subject: 'Verify your Acme account', // overrides system subject
    // email_body not set → system default is used
  }),
  metadata: JSON.stringify({ fromName: 'Acme Support' }),
  changeNote: 'Brand customization',
});
```

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
pnpm test           # unit tests
pnpm test:e2e       # end-to-end tests
```

Key test coverage:

- `templates.renderer.spec.ts` — slot merge logic, Handlebars compilation, org override wins
- `templates.service.spec.ts` — CRUD, versioning (snapshot on update), revert, render with/without org override
