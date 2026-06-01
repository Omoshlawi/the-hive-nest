# The Hive Nest

Backend and frontend monorepo for **Havena** — a multi-tenant property management platform. Landlords and agencies manage properties, listings, files, virtual tours, and team members across isolated organisations.

Managed with **pnpm 9 workspaces** and **Turborepo**. For full architecture, patterns, and guidelines see [`PROJECT_SPEC.md`](./PROJECT_SPEC.md).

---

## How a request travels

Understanding the flow is the single most useful thing before you touch any code.

```
Browser / API client
       │  HTTP  (port 8090)
       ▼
api-gateway-service        ← the only service that speaks HTTP
       │  gRPC  (dynamic ports, resolved via registry)
       ├──► property-service   → PostgreSQL (property schema)
       ├──► identity-service*  → managed by Better Auth in api-gateway DB
       ├──► file-service        → PostgreSQL + AWS S3
       ├──► reference-service   → PostgreSQL (geo / lookup data)
       ├──► virtual-tour-service → PostgreSQL
       └──► template-service
       │
       └──► registry-service  (port 4001, Redis)
                 ↑ all services register here on startup
```

> `*` Identity data (users, organisations, members) lives in the api-gateway's own Prisma schema and is managed by Better Auth. There is no separate identity-service process — `@hive/identity` is a gRPC package that wraps queries into the api-gateway's own DB.

Every feature module follows the same two-layer structure:

| Layer                                         | Location         | Responsibility                                                  |
| --------------------------------------------- | ---------------- | --------------------------------------------------------------- |
| **Domain package** (`packages/property/`)     | Shared library   | Proto definitions, generated gRPC types, injectable gRPC client |
| **Domain service** (`apps/property-service/`) | Runnable process | Business logic, Prisma queries, gRPC server                     |

The API Gateway imports the domain **package** (client side). The domain **service** implements the gRPC server. They share type definitions through the proto files in the package.

---

## Repository layout

```
the-hive-nest/
├── apps/
│   ├── api-gateway-service/   # HTTP entry point — the only public-facing service
│   ├── property-service/      # Property domain: properties, amenities, media, categories
│   ├── file-service/          # File management (AWS S3 + metadata DB)
│   ├── reference-service/     # Geo reference data: countries, cities, address hierarchy
│   ├── virtual-tour-service/  # Virtual tour links and metadata
│   ├── registry-service/      # Service discovery (Redis-backed, port 4001)
│   ├── template-service/      # Reusable templates
│   └── web/                   # Next.js 14 frontend
└── packages/
    ├── common/                # Interceptors, filters, Prisma module, query builder services
    ├── property/              # Property proto + generated types + gRPC client
    ├── identity/              # User / org / member proto + gRPC client
    ├── files/                 # Files proto + gRPC client
    ├── reference/             # Reference proto + gRPC client
    ├── vitual-tour/           # Virtual-tour proto + gRPC client  (typo in dir name)
    ├── template/              # Template package
    ├── registry/              # Registry client + HiveServiceModule
    ├── authorization/         # Reserved — not currently active
    ├── utils/                 # Server config helpers, utilities
    ├── ui/                    # Shared React components
    ├── eslint-config/         # Shared ESLint flat configs
    ├── jest-config/           # Shared Jest configs (nest / nest-e2e / base)
    ├── typescript-config/     # Shared tsconfig bases
    └── tools/                 # scaffold-resource CLI + hive-gen
```

---

## Prerequisites

- **Node.js** ≥ 18
- **pnpm** 9 — `corepack enable && corepack prepare pnpm@latest --activate`
- **PostgreSQL** — one database per service that owns a schema (see below)
- **Redis** — used by `registry-service` for service discovery

---

## Environment setup

Each service reads its configuration via `@itgorillaz/configify`. There are no untyped `process.env` reads — every variable is declared as a typed class property validated at startup.

Create a `.env` file in each service directory. Minimum required variables:

### `apps/api-gateway-service/.env`

```env
DATABASE_URL=postgresql://user:password@localhost:5432/hive_gateway
BETTER_AUTH_SECRET=your-secret-here
BETTER_AUTH_URL=http://localhost:8090
HTTP_PORT=8090
```

### `apps/property-service/.env`

```env
DATABASE_URL=postgresql://user:password@localhost:5432/hive_property
```

### `apps/file-service/.env`

```env
DATABASE_URL=postgresql://user:password@localhost:5432/hive_files
S3_ACCESS_KEY_ID=your-key
S3_SECRETE_ACCESS_KEY_ID=your-secret
S3_ENDPOINT=http://localhost:9000
S3_BUCKET_PUBLIC=hive-public
S3_BUCKET_PRIVATE=hive-private
```

### `apps/reference-service/.env`

```env
DATABASE_URL=postgresql://user:password@localhost:5432/hive_reference
```

### `apps/virtual-tour-service/.env`

```env
DATABASE_URL=postgresql://user:password@localhost:5432/hive_virtual_tour
```

### `apps/registry-service/.env`

```env
REDIS_DB_URL=redis://localhost:6379
STORAGE_STRATEGY=redis
SERVICE_TTL=60
```

> `template-service` and `registry-service` have no Prisma schema. Only the five services above need a `DATABASE_URL`.

---

## Getting started

```bash
# 1. Install all dependencies and build shared packages
pnpm install

# 2. Generate all Prisma clients (must run before migrations)
pnpm db:generate

# 3. Run migrations for each service that owns a database
pnpm --filter @hive/api-gateway-service db:migrate
pnpm --filter @hive/property-service db:migrate
pnpm --filter @hive/file-service db:migrate
pnpm --filter @hive/reference-service db:migrate
pnpm --filter @hive/virtual-tour-service db:migrate

# 4. Start all services
pnpm dev
```

Once running, the API is available at **http://localhost:8090**:

- Swagger UI: `http://localhost:8090/api`
- Scalar API docs: `http://localhost:8090/api-doc`

> Domain services (property, file, reference, etc.) bind to dynamic ports resolved at runtime by the registry. You interact with them exclusively through the API Gateway — never directly.

---

## Commands

### Root — runs across all apps and packages via Turbo

| Command            | Description                                       |
| ------------------ | ------------------------------------------------- |
| `pnpm dev`         | Start all services in watch mode (concurrency 20) |
| `pnpm start`       | Build then start all services in production mode  |
| `pnpm build`       | Build all packages then all apps                  |
| `pnpm test`        | Run all unit test suites                          |
| `pnpm test:e2e`    | Run all E2E test suites                           |
| `pnpm lint`        | ESLint across all apps and packages               |
| `pnpm format`      | Prettier across all `ts/tsx/md` files             |
| `pnpm scaffold`    | Run the `hive-scaffold` resource generator        |
| `pnpm db:generate` | Regenerate all Prisma clients                     |

### Targeting a single service

```bash
pnpm --filter @hive/api-gateway-service dev
pnpm --filter @hive/property-service test
pnpm --filter @hive/property gen                  # Regenerate proto types after .proto changes
pnpm --filter @hive/api-gateway-service db:generate
pnpm --filter @hive/api-gateway-service db:migrate
pnpm --filter @hive/api-gateway-service auth:gen  # Regenerate Better Auth schema
```

---

## Adding a new resource

Use the scaffold tool to generate the full slice:

```bash
pnpm scaffold --resource <Name> --package <pkg> --service <SERVICE_NAME>

# Example — adds a "Review" resource to the property domain
pnpm scaffold --resource Review --package property --service PROPERTIES_SERVICE_NAME
```

Generates 6 files: DTO, domain service, domain controller, domain module, gateway controller, gateway module.

**Steps after scaffolding:**

1. Add message definitions to `packages/<pkg>/src/proto/*.proto`
2. `pnpm --filter @hive/<pkg> gen` — regenerate TypeScript types
3. Export new types from `packages/<pkg>/src/types/index.ts`
4. Add resource methods to `packages/<pkg>/src/client/hive-<pkg>-client.service.ts`
5. Import the new module in `apps/<pkg>-service/src/app.module.ts`
6. Import the new module in `apps/api-gateway-service/src/app.module.ts`

---

## Tooling

### Jest — `@hive/jest-config`

No inline jest config in any `package.json`. Every app/package uses a one-liner:

```js
// jest.config.js
module.exports = require('@hive/jest-config/nest');

// test/jest-e2e.js
module.exports = require('@hive/jest-config/nest-e2e');
```

To change jest behaviour globally, edit `packages/jest-config/nest.js`.

### ESLint — `@hive/eslint-config`

Flat config format (`eslint.config.mjs`) everywhere. Each app and package owns its config.

| Export                        | Use             |
| ----------------------------- | --------------- |
| `@hive/eslint-config/nest`    | NestJS apps     |
| `@hive/eslint-config/library` | Shared packages |
| `@hive/eslint-config/next`    | Next.js app     |

### Pre-commit hooks

Husky + lint-staged, installed automatically on `pnpm install`.  
Runs `prettier --write` on all staged files. ESLint runs in CI via `pnpm lint`.

Skip in an emergency: `git commit --no-verify`

---

## Troubleshooting

**`pnpm install` fails with build errors**  
The `postinstall` script builds all `packages/**`. If a package fails to compile, fix the TypeScript error first, then re-run `pnpm install`.

**Services fail to start — "cannot connect to registry"**  
`registry-service` must be running before domain services start. Check that Redis is running and `REDIS_DB_URL` is set correctly in `apps/registry-service/.env`.

**`pnpm db:generate` fails with "schema not found"**  
The Prisma client output path is `generated/prisma/` relative to the service root. Run `pnpm --filter @hive/<service> db:generate` in isolation to see the specific error.

**Proto type generation fails**  
Ensure `protoc` is installed (`brew install protobuf` on macOS). Then run `pnpm --filter @hive/<pkg> gen`.

**Port conflicts**  
The API Gateway binds to `HTTP_PORT` (default `8090`). Domain services use dynamic ports via `getFreePort()` — they register their resolved address with the registry on startup, so port conflicts between domain services are handled automatically.

---

## Further reading

- [`PROJECT_SPEC.md`](./PROJECT_SPEC.md) — architecture decisions, all code patterns, auth, rules
- [`packages/tools/`](./packages/tools/) — scaffold CLI source
- [`packages/common/`](./packages/common/) — query builder services, interceptors, Prisma module
- [`apps/api-gateway-service/src/auth/auth.acl.ts`](./apps/api-gateway-service/src/auth/auth.acl.ts) — Better Auth ACL definitions (resource permissions)
