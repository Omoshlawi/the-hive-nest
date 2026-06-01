# The Hive Nest

NestJS microservices monorepo for the Havena / The Hive property management platform.  
Managed with **pnpm workspaces** and **Turborepo**.

See [`PROJECT_SPEC.md`](./PROJECT_SPEC.md) for full architecture and code-pattern reference.

---

## Repository layout

```
the-hive-nest/
├── apps/
│   ├── api-gateway-service/   # Single HTTP entry point → routes gRPC to domain services
│   ├── property-service/      # Property domain (Prisma + gRPC server)
│   ├── file-service/          # File management (AWS S3)
│   ├── reference-service/     # Reference / lookup data
│   ├── virtual-tour-service/
│   ├── registry-service/      # Service discovery + health monitoring
│   ├── template-service/
│   └── web/                   # Next.js 14 frontend
└── packages/
    ├── common/                # Interceptors, filters, base service, shared DTOs
    ├── property/              # Property proto + generated types + gRPC client
    ├── identity/              # Identity proto + gRPC client
    ├── files/                 # Files proto + gRPC client
    ├── reference/             # Reference proto + gRPC client
    ├── vitual-tour/           # Virtual-tour package
    ├── registry/              # Registry service client
    ├── authorization/         # OpenFGA integration
    ├── utils/                 # Utility functions
    ├── ui/                    # Shared React components
    ├── eslint-config/         # Shared ESLint flat configs
    ├── jest-config/           # Shared Jest configs (nest / nest-e2e / base)
    ├── typescript-config/     # Shared tsconfig bases
    └── tools/                 # scaffold-resource CLI + generators
```

---

## Prerequisites

- **Node.js** ≥ 18
- **pnpm** 9 — install via `corepack enable && corepack prepare pnpm@latest --activate`

---

## Getting started

```bash
# Install all dependencies + build shared packages
pnpm install

# Start all services with hot-reload
pnpm dev
```

`pnpm install` also runs `prepare`, which wires the pre-commit hook (see [Pre-commit hooks](#pre-commit-hooks)).

---

## Commands

### Root (runs across all apps + packages via Turbo)

| Command            | Description                                       |
| ------------------ | ------------------------------------------------- |
| `pnpm dev`         | Start all services in watch mode (concurrency 20) |
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
pnpm --filter @hive/property gen          # Regenerate proto types after .proto changes
pnpm --filter @hive/api-gateway-service db:generate
pnpm --filter @hive/api-gateway-service db:migrate   # Interactive — prompts for name
```

---

## Tooling

### Jest — `@hive/jest-config`

Shared Jest configuration lives in `packages/jest-config/`. Every app and package imports it — there is no inline jest config in any `package.json`.

**Exports:**

| Path                         | Use                                                   |
| ---------------------------- | ----------------------------------------------------- |
| `@hive/jest-config/nest`     | Unit tests for NestJS apps and packages               |
| `@hive/jest-config/nest-e2e` | E2E tests (`test/` directory, `.e2e-spec.ts` pattern) |
| `@hive/jest-config/base`     | Base config (extend for custom setups)                |

**How each package uses it:**

```js
// jest.config.js  (unit tests — every app and package)
module.exports = require('@hive/jest-config/nest');
```

```js
// test/jest-e2e.js  (E2E — every app)
module.exports = require('@hive/jest-config/nest-e2e');
```

To change jest behaviour globally (e.g. add a `moduleNameMapper`, increase timeout), edit `packages/jest-config/nest.js`. The change propagates to all 17 packages immediately — no per-package edits needed.

### ESLint — `@hive/eslint-config`

All configs use the **flat config format** (`eslint.config.mjs`). The root config applies only to root-level files; each app and package carries its own `eslint.config.mjs`.

**Available configs:**

| Export                               | Use                      |
| ------------------------------------ | ------------------------ |
| `@hive/eslint-config/nest`           | NestJS apps              |
| `@hive/eslint-config/library`        | Shared packages          |
| `@hive/eslint-config/next`           | Next.js apps             |
| `@hive/eslint-config/react-internal` | React component packages |
| `@hive/eslint-config/prettier-base`  | Adds Prettier rules      |

**Typical package config (`eslint.config.mjs`):**

```js
// @ts-check
import hiveConfig from '@hive/eslint-config/nest';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['eslint.config.mjs', 'dist/**/*'] },
  ...hiveConfig,
  {
    languageOptions: {
      parserOptions: { tsconfigRootDir: import.meta.dirname },
    },
  },
);
```

### TypeScript — `@hive/typescript-config`

| File                 | Use                             |
| -------------------- | ------------------------------- |
| `nestjs.json`        | NestJS apps and packages        |
| `nextjs.json`        | Next.js app                     |
| `react-library.json` | React component packages        |
| `base.json`          | Base (strict, ES2022, NodeNext) |

Each `tsconfig.json` extends the relevant variant:

```json
{ "extends": "@hive/typescript-config/nestjs" }
```

### Pre-commit hooks

Pre-commit hooks are managed by **Husky** + **lint-staged**. After `pnpm install`, Husky installs a Git hook that runs automatically on every `git commit`.

**What runs on commit:**

- `prettier --write` on all staged `ts / tsx / js / mjs / json / md / css` files

This guarantees consistent formatting without requiring developers to remember to run `pnpm format`. ESLint is enforced in CI via `pnpm lint`.

**First-time setup** — the hook is installed automatically by `pnpm install` via the `prepare` script. To install it manually:

```bash
pnpm husky
```

**Skipping the hook** (emergency only):

```bash
git commit --no-verify -m "message"
```

---

## Adding a new resource

Use the scaffold tool to generate the full slice for a new domain resource:

```bash
pnpm scaffold --resource <ResourceName> --package <package> --service <SERVICE_NAME>

# Example
pnpm scaffold --resource Review --package property --service PROPERTIES_SERVICE_NAME
```

This generates six files:

| File               | Location                                                           |
| ------------------ | ------------------------------------------------------------------ |
| DTO schema         | `packages/<pkg>/src/dto/<resource>.dto.ts`                         |
| Domain service     | `apps/<pkg>-service/src/<resource>/<resource>.service.ts`          |
| Domain controller  | `apps/<pkg>-service/src/<resource>/<resource>.controller.ts`       |
| Domain module      | `apps/<pkg>-service/src/<resource>/<resource>.module.ts`           |
| Gateway controller | `apps/api-gateway-service/src/<resource>/<resource>.controller.ts` |
| Gateway module     | `apps/api-gateway-service/src/<resource>/<resource>.module.ts`     |

**Steps after scaffolding:**

1. Add message definitions to `packages/<pkg>/src/proto/*.proto`
2. Run `pnpm --filter @hive/<pkg> gen` to regenerate TypeScript types
3. Export new types from `packages/<pkg>/src/types/index.ts`
4. Add resource methods to `packages/<pkg>/src/client/hive-<pkg>-client.service.ts`
5. Import the new module in `apps/<pkg>-service/src/app.module.ts`
6. Import the new module in `apps/api-gateway-service/src/app.module.ts`

---

## Data layer

Each service owns its own Prisma schema at `apps/<service>/prisma/schema.prisma`. Connection is managed via `prisma.config.ts` — no `url` in the datasource block.

```bash
pnpm --filter @hive/<service> db:migrate   # Create and apply a migration (prompts for name)
pnpm --filter @hive/<service> db:generate  # Regenerate Prisma client after schema change
```

The Prisma module is shared from `@hive/common`. Each service only needs:

```typescript
// src/prisma/prisma.service.ts
@Injectable()
export class PrismaService extends createPrismaService(PrismaClient) {}
```

---

## Environment

Each service reads its config via `@itgorillaz/configify`. Required variables are declared as typed class properties validated at startup — there are no untyped `process.env` reads in service code.

Copy `.env.example` (if present) to `.env.local` in each service directory that needs it.

---

## Further reading

- [`PROJECT_SPEC.md`](./PROJECT_SPEC.md) — architecture, service communication pattern, controller/service conventions, auth
- [`packages/tools/`](./packages/tools/) — scaffold CLI source and generator templates
- [`packages/common/`](./packages/common/) — shared interceptors, filters, base CRUD service, Prisma module
