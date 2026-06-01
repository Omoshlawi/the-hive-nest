# file-service

gRPC microservice for file management. Handles file uploads, downloads, deduplication, and signed URL generation against an S3-compatible storage backend (AWS S3 or MinIO).

## What it owns

- **File metadata** — stores file records (name, MIME type, size, hash, S3 key) in PostgreSQL
- **File blobs** — content-addressed blob storage with deduplication via SHA-256 hash
- **S3 integration** — upload, download, and signed URL generation
- **File usage scopes** — rules that restrict which file types can be used in which context
- **File usage rules** — per-scope constraints on allowed MIME types and sizes

## Architecture

gRPC server only — no direct HTTP routes. All traffic arrives from `api-gateway-service`.

```
api-gateway-service → gRPC → file-service → PostgreSQL
                                          → S3 / MinIO
```

## Environment variables

| Variable                   | Required | Default                 | Description                                                                                   |
| -------------------------- | -------- | ----------------------- | --------------------------------------------------------------------------------------------- |
| `DATABASE_URL`             | ✅       | —                       | PostgreSQL connection string                                                                  |
| `S3_ACCESS_KEY_ID`         | ✅       | —                       | S3 / MinIO access key ID                                                                      |
| `S3_SECRETE_ACCESS_KEY_ID` | ✅       | —                       | S3 / MinIO secret access key _(note: typo in env var name is intentional — matches codebase)_ |
| `S3_ENDPOINT`              | ❌       | `http://localhost:9000` | S3 endpoint URL (use MinIO locally)                                                           |
| `S3_BUCKET_PUBLIC`         | ❌       | `hive-files-public`     | Bucket for publicly accessible files                                                          |
| `S3_BUCKET_PRIVATE`        | ❌       | `hive-files-private`    | Bucket for private files                                                                      |
| `ALLOWED_MIME_TYPES`       | ❌       | (see `s3.config.ts`)    | Comma-separated list of permitted MIME types                                                  |
| `SERVER_URL`               | ❌       | `0.0.0.0:4001`          | Address of `registry-service`                                                                 |

See `.env.example` for a ready-to-copy local configuration.

## Local S3 with MinIO

```bash
# Run MinIO with Docker
docker run -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=root \
  -e MINIO_ROOT_PASSWORD=Admin123 \
  minio/minio server /data --console-address ":9001"

# MinIO console: http://localhost:9001
# Create buckets: hive-files-public, hive-files-private
```

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
