# virtual-tour-service

gRPC microservice for virtual tour management. Stores tour scenes and their associated tile metadata, and coordinates with `file-service` to retrieve the media assets used in tours.

## What it owns

- **Tours** — top-level virtual tour records linked to a property
- **Tour scenes** — individual 360° scenes within a tour, ordered and linked to panoramic media
- **Tile metadata** — spatial tile references for scene rendering

## Architecture

gRPC server only — no direct HTTP routes. All traffic arrives from `api-gateway-service`.

```
api-gateway-service → gRPC → virtual-tour-service → PostgreSQL
                                                  → file-service (for media)
```

Supports large message payloads (up to 100 MB) to accommodate high-resolution panoramic images transferred via gRPC.

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
```

## Testing

```bash
pnpm test
pnpm test:e2e
```
