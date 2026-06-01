# template-service

Lightweight HTTP microservice for reusable link and template management. Provides a minimal API for creating and querying link records that can be embedded in other resources.

## What it owns

- **Links** — short, shareable link records (e.g. shareable property links, invitation links)

## Architecture

HTTP service — no gRPC server. Runs on a dynamic port and registers with `registry-service`.

```
api-gateway-service → gRPC → template-service → (in-memory / future persistence)
```

> This service currently has **no Prisma schema** and no database.

## Environment variables

| Variable     | Required | Default        | Description                          |
| ------------ | -------- | -------------- | ------------------------------------ |
| `PORT`       | ❌       | `0`            | HTTP server port (`0` = auto-assign) |
| `SERVER_URL` | ❌       | `0.0.0.0:4001` | Address of `registry-service`        |

No `.env` file is required to run this service locally.

## Setup

```bash
pnpm dev
```

## Testing

```bash
pnpm test
pnpm test:e2e
```
