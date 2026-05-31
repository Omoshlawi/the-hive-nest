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
