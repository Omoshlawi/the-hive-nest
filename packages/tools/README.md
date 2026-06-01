# @hive/tools

Dev tooling for the `the-hive-nest` monorepo. Provides CLI commands for proto type generation, asset copying, Prisma client generation, and resource scaffolding.

## How it works

`@hive/tools` is installed as a **root devDependency** — you do not add it to individual package `package.json` files. The root `.npmrc` hoists its bins to `node_modules/.bin/`, making all commands available to every package in the workspace when pnpm runs their scripts.

## Commands

### `hive-gen`

Generates TypeScript types from `.service.proto` files using `ts-proto`.

Looks for `src/proto/*.service.proto` relative to the current working directory and writes generated types to `src/types/`. Runs `pnpm exec protoc` with `nestJs=true` so the output is compatible with NestJS microservices.

```bash
# runs from the package directory
pnpm --filter @hive/property gen
```

### `hive-copy-assets`

Copies all `.proto` files from `src/proto/` to `dist/proto/` so they are available at runtime (the gRPC client needs the `.proto` file on disk to load the package definition).

```bash
pnpm --filter @hive/property copy-assets
```

### `hive-scaffold`

Scaffolds a new gRPC resource across the domain service and API gateway. Generates six files and prints a numbered checklist of the remaining manual steps (proto messages, `pnpm gen`, barrel exports, client wrapper, module imports).

```bash
# from the monorepo root
pnpm scaffold -- --resource <PascalCaseName> --package <pkg> --service <SERVICE_NAME_CONSTANT>

# example
pnpm scaffold -- --resource PropertyTag --package property --service PROPERTIES_SERVICE_NAME
```

**Arguments:**

| Flag | Description |
|------|-------------|
| `--resource` | PascalCase resource name (e.g. `PropertyTag`) |
| `--package` | Package name matching `packages/<pkg>/` and `apps/<pkg>-service/` (e.g. `property`) |
| `--service` | The gRPC service name constant used in `@GrpcMethod` decorators (e.g. `PROPERTIES_SERVICE_NAME`) |
| `--no-gateway` | Skip generating the API gateway controller and module |

**Files generated:**

```
packages/<pkg>/src/dto/<resources>.dto.ts
apps/<pkg>-service/src/<resources>/<resources>.service.ts
apps/<pkg>-service/src/<resources>/<resources>.controller.ts
apps/<pkg>-service/src/<resources>/<resources>.module.ts
apps/api-gateway-service/src/<resources>/<resources>.controller.ts
apps/api-gateway-service/src/<resources>/<resources>.module.ts
```

After running the scaffold, follow the printed checklist to complete the remaining steps (proto definitions, type generation, barrel exports, client wrapper, module registration).

## Standard package scripts

Every proto package in the monorepo uses the same two scripts:

```json
{
  "scripts": {
    "gen": "hive-gen && hive-copy-assets",
    "postinstall": "pnpm gen"
  }
}
```

The `postinstall` hook ensures types are regenerated whenever dependencies are installed.

## Adding a new proto package

1. Create the package under `packages/<name>/` following the existing structure (`src/proto/`, `src/types/`, `src/client/`, `src/constants/`).
2. Add the two scripts above to `package.json` — no local `scripts/` directory needed.
3. Run `pnpm install` from the monorepo root to link the package into the workspace.
4. Run `pnpm --filter @hive/<name> gen` to generate the initial types.

## Adding a new Prisma service

When creating a new NestJS microservice that needs a database, follow this pattern. All shared infrastructure (`PrismaModule`, `PrismaConfig`, `createPrismaService`) lives in `@hive/common` — nothing needs to be copied between services.

**1. Schema** — `prisma/schema.prisma`. Use `prisma-client` provider; leave the datasource block without a `url` field:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}
```

**2. Root config** — copy `prisma.config.ts` from any existing service (e.g. `apps/property-service/prisma.config.ts`). It reads `DATABASE_URL` via configify and is used by the Prisma CLI for migrations and generation.

**3. Prisma service** — `src/prisma/prisma.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { createPrismaService } from '@hive/common';
import { PrismaClient } from '../../generated/prisma/client';

@Injectable()
export class PrismaService extends createPrismaService(PrismaClient) {}
```

`createPrismaService` is a generic mixin factory in `@hive/common` that handles the constructor injection, `onModuleInit`, and `onModuleDestroy`. The extending class inherits full type-safe access to all model accessors generated for this service.

**4. Wire in `app.module.ts`**:

```typescript
import { PrismaConfig, PrismaModule } from '@hive/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    PrismaModule.forRootAsync({
      global: true,
      service: PrismaService,       // required — the service-specific class
      inject: [PrismaConfig],
      useFactory: (config: PrismaConfig) => ({
        adapter: new PrismaPg({ connectionString: config.databaseUrl }),
      }),
    }),
  ],
})
export class AppModule {}
```

**5. Add Prisma scripts** to the service `package.json`:

```json
{
  "scripts": {
    "db": "prisma",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev"
  },
  "dependencies": {
    "@prisma/adapter-pg": "^7.8.0",
    "@prisma/client": "^7.8.0"
  },
  "devDependencies": {
    "prisma": "^7.8.0"
  }
}
```

**6. Generate and migrate**:

```bash
pnpm --filter @hive/<service> db:generate   # generates the typed Prisma client
pnpm --filter @hive/<service> db:migrate    # runs initial migration (prompts for name)
```

The `db:generate` Turbo task is already registered globally — `pnpm db:generate` from the root will include the new service automatically.
