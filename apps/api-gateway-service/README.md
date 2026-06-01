# api-gateway-service

The single public HTTP entry point for the Havena platform. All REST API traffic flows through here — the gateway authenticates requests, checks organisation permissions, then routes calls to the appropriate domain service over gRPC.

## What it owns

- **HTTP/REST API** — all client-facing routes
- **Authentication** — Better Auth session management at `POST /api/auth/*`
- **Identity data** — users, organisations, members, and invitations (in its own Prisma schema, managed by Better Auth)
- **Request routing** — delegates to property, file, reference, and virtual-tour services via gRPC through the service registry
- **API documentation** — Swagger UI at `/api`, Scalar at `/api-doc`

## Architecture

```
Client → HTTP :8090 → api-gateway-service
                            │
                            ├─ Better Auth   (session + org management)
                            ├─ Auth guards   (RequireOrganizationPermission, etc.)
                            └─ gRPC → property-service
                                   → file-service
                                   → reference-service
                                   → virtual-tour-service
```

Identity data lives in this service's own database — there is no separate identity process.

## Environment variables

| Variable                | Required | Default        | Description                                                    |
| ----------------------- | -------- | -------------- | -------------------------------------------------------------- |
| `PORT`                  | ✅       | —              | HTTP server port                                               |
| `DATABASE_URL`          | ✅       | —              | PostgreSQL connection string for the auth/identity schema      |
| `BETTER_AUTH_SECRET`    | ✅       | —              | Secret used to sign auth sessions                              |
| `BETTER_AUTH_URL`       | ✅       | —              | Public base URL of this service (e.g. `http://localhost:8090`) |
| `IDENTITY_SERVICE_PORT` | ✅       | —              | Port for the built-in identity gRPC server (`0` = auto-assign) |
| `SERVER_URL`            | ❌       | `0.0.0.0:4001` | Address of `registry-service`                                  |

> `name` and `version` are read from `package.json` automatically.

See `.env.example` for a ready-to-copy local configuration.

## Setup

```bash
# Install (run from monorepo root)
pnpm install

# Copy and fill in env vars
cp .env.example .env

# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Start in watch mode
pnpm dev
```

## Database

Schema: `prisma/schema.prisma`  
Generated client: `generated/prisma/`

```bash
pnpm db:generate   # Regenerate client after schema change
pnpm db:migrate    # Create + apply a migration (prompts for name)
pnpm auth:gen      # Regenerate Better Auth schema after auth config changes
```

## Testing

```bash
pnpm test          # Unit tests
pnpm test:e2e      # E2E tests (requires DB)
```
