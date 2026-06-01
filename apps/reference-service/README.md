# reference-service

gRPC microservice for geographic and administrative reference data. Provides the stable lookup data that other services depend on: address hierarchy (countries → states → cities) and identifier sequences for generating structured IDs.

## What it owns

- **Address hierarchy** — country / state / city / district reference data
- **Addresses** — concrete address records linked to the hierarchy
- **Identifier sequences** — configurable counter-based ID generators (e.g. property reference numbers)

## Architecture

gRPC server only — no direct HTTP routes. All traffic arrives from `api-gateway-service`.

```
api-gateway-service → gRPC → reference-service → PostgreSQL
```

## Environment variables

| Variable       | Required | Default        | Description                                                |
| -------------- | -------- | -------------- | ---------------------------------------------------------- |
| `DATABASE_URL` | ✅       | —              | PostgreSQL connection string                               |
| `PORT`         | ❌       | `0`            | HTTP port for registry health endpoint (`0` = auto-assign) |
| `SERVER_URL`   | ❌       | `0.0.0.0:4001` | Address of `registry-service`                              |

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

# Optional: seed reference data (countries, cities, etc.)
pnpm db:seed
```

## Testing

```bash
pnpm test
pnpm test:e2e
```
