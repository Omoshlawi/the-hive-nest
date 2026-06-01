# property-service

gRPC microservice for the property management domain. Owns the canonical data for properties and all related lookup entities: amenities, categories, attribute types, property media, and relationship types.

## What it owns

- **Properties** — full property lifecycle (create, read, update, soft-delete)
- **Amenities** — facility tags attachable to properties
- **Categories** — property classification taxonomy
- **Attribute types** — custom attribute schema definitions
- **Property media** — images, videos, and documents linked to a property
- **Relationship types** — labels for property-to-property relationships
- **Property relationships** — the actual relationship edges between properties

## Architecture

This service is a gRPC server only — it does not expose HTTP routes directly. All traffic arrives from `api-gateway-service`.

```
api-gateway-service → gRPC → property-service → PostgreSQL
```

On startup the service registers itself with `registry-service` so the gateway can discover its dynamically assigned gRPC port.

## Environment variables

| Variable                     | Required | Default        | Description                                                      |
| ---------------------------- | -------- | -------------- | ---------------------------------------------------------------- |
| `DATABASE_URL`               | ✅       | —              | PostgreSQL connection string                                     |
| `PORT`                       | ❌       | `0`            | HTTP port (used for registry health endpoint; `0` = auto-assign) |
| `PROPERTY_GRPC_SERVICE_PORT` | ❌       | `0`            | gRPC server port (`0` = auto-assign)                             |
| `SERVER_URL`                 | ❌       | `0.0.0.0:4001` | Address of `registry-service`                                    |

> `name` and `version` are read from `package.json` automatically.

See `.env.example` for a ready-to-copy local configuration.

## Setup

```bash
cp .env.example .env
pnpm db:generate
pnpm db:migrate
pnpm dev
```

## Database

Schema: `prisma/schema.prisma`  
Generated client: `generated/prisma/`

```bash
pnpm db:generate
pnpm db:migrate
```

## Proto types

After changing any `.proto` file in `packages/property/src/proto/`:

```bash
pnpm --filter @hive/property gen
```

## Testing

```bash
pnpm test
pnpm test:e2e
```
