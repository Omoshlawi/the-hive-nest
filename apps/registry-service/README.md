# registry-service

Central gRPC service for service discovery and health monitoring. All domain services register here on startup and send periodic heartbeats. The API gateway uses this service to discover where to route gRPC calls.

## What it owns

- **Service registration** — domain services register their name, version, endpoints, and tags on startup
- **Service discovery** — clients query for services by name, version, tags, or metadata
- **Health monitoring** — heartbeat tracking with configurable TTL; expired registrations are evicted automatically
- **Live updates** — streaming RPC that pushes service-added / service-removed events to subscribers (used by `HiveServiceClient` to maintain its proxy pool)

## Architecture

gRPC only — no HTTP routes. Runs on a fixed port (`4001` by default) so other services can bootstrap without needing to discover the registry first.

```
all services → gRPC :4001 → registry-service → Redis
```

Storage is pluggable (`STORAGE_STRATEGY`). Redis is the production backend; an in-memory strategy is available for tests.

## Environment variables

| Variable           | Required | Default         | Description                                                                       |
| ------------------ | -------- | --------------- | --------------------------------------------------------------------------------- |
| `REDIS_DB_URL`     | ✅       | —               | Redis connection URL                                                              |
| `PORT`             | ❌       | `4001`          | gRPC server port                                                                  |
| `STORAGE_STRATEGY` | ❌       | `redis_storage` | Storage backend: `redis_storage` or `memory_storage`                              |
| `SERVICE_TTL`      | ❌       | `60`            | Seconds before a registration without a heartbeat is evicted (`0` = never expire) |

> `name` and `version` are read from `package.json` automatically.

See `.env.example` for a ready-to-copy local configuration.

## Local Redis

```bash
# Run Redis with Docker
docker run -p 6379:6379 redis:7 redis-server --requirepass Admin123
```

## Setup

```bash
cp .env.example .env
pnpm dev
```

> This service has **no Prisma schema** — it uses Redis for all persistence.

## Testing

```bash
pnpm test
pnpm test:e2e
```
