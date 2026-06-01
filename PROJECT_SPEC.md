# The Hive Nest — Project Specification & Guidelines

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Code Patterns & Conventions](#code-patterns--conventions)
6. [Service Communication](#service-communication)
7. [Data Layer](#data-layer)
8. [API Design Patterns](#api-design-patterns)
9. [Authentication & Authorization](#authentication--authorization)
10. [Package Development](#package-development)
11. [Development Workflow](#development-workflow)
12. [Testing Patterns](#testing-patterns)
13. [Tooling](#tooling)
14. [Configuration Management](#configuration-management)
15. [Build & Deployment](#build--deployment)
16. [Rules & Guidelines](#rules--guidelines)

---

## Project Overview

**The Hive Nest** is a monorepo-based microservices architecture for the Havena property management platform. The system is built using:

- **Monorepo**: Turborepo with pnpm workspaces
- **Backend**: NestJS microservices communicating over gRPC
- **Frontend**: Next.js web application
- **Database**: PostgreSQL via Prisma v7 (per-service schemas, pg adapter)
- **Service Discovery**: Custom registry service for dynamic discovery and health monitoring

### Key Features

- Multi-tenant architecture with organisation-based isolation
- Service-to-service communication via gRPC
- API Gateway pattern for all HTTP entry points
- Role-based access control via OpenFGA (`@hive/authorization`)
- Property management domain: virtual tours, files, reference data, and more

---

## Architecture

### Architecture Pattern

- **Microservices**: Each domain has its own service (property, identity, file, reference, virtual-tour, …)
- **API Gateway**: Single HTTP/REST entry point (`api-gateway-service`) that routes calls to domain services via gRPC
- **Service Registry**: Central registry service for service discovery and health monitoring
- **Shared Packages**: Common code (interceptors, Prisma module, base service, DTOs) shared via workspace packages

### Service Architecture

```
┌─────────────────┐
│   Next.js Web   │
└────────┬────────┘
         │ HTTP
         ▼
┌──────────────────────┐
│  API Gateway Service │
└────────┬─────────────┘
         │ gRPC
    ┌────┴──────────────────────────┐
    │                               │
┌───▼─────────┐            ┌───────▼──────┐
│  Property   │            │   Identity   │
│  Service    │            │   Service    │
└─────────────┘            └──────────────┘
    (File, Reference, Virtual-Tour, Template services follow the same pattern)
         │
         ▼
┌─────────────────┐
│ Registry Service│  ← all services register here on startup
└─────────────────┘
```

### Service Types

1. **API Gateway Service** — HTTP/REST endpoints, auth, routes to domain services via gRPC
2. **Domain Services** — business logic for a specific domain (property, identity, file, reference, virtual-tour, template)
3. **Registry Service** — service discovery and health monitoring
4. **Web** — Next.js frontend

---

## Technology Stack

### Core

|                     |                  |
| ------------------- | ---------------- |
| **Runtime**         | Node.js ≥ 18     |
| **Package Manager** | pnpm 9.15.9      |
| **Build Tool**      | Turborepo 2.5.5  |
| **Language**        | TypeScript 5.7.x |

### Backend

|                             |                                                                |
| --------------------------- | -------------------------------------------------------------- |
| **Framework**               | NestJS 11.x                                                    |
| **Microservices transport** | `@nestjs/microservices` (gRPC)                                 |
| **Database ORM**            | Prisma 7.x (pg adapter, per-service schemas)                   |
| **Validation**              | Zod 4.x + nestjs-zod 5.x (beta)                                |
| **API docs**                | `@nestjs/swagger` (Swagger UI at `/api`, Scalar at `/api-doc`) |
| **Authentication**          | Better Auth (`better-auth` + `@thallesp/nestjs-better-auth`)   |
| **Authorization**           | OpenFGA via `@hive/authorization`                              |
| **Scheduling**              | `@nestjs/schedule`                                             |
| **Config**                  | `@itgorillaz/configify`                                        |

### Frontend (web)

|               |              |
| ------------- | ------------ |
| **Framework** | Next.js 14.1 |
| **UI**        | React 18.2   |

### Development Tools

|                          |                                                |
| ------------------------ | ---------------------------------------------- |
| **Linting**              | ESLint 9.x (flat config — `eslint.config.mjs`) |
| **Formatting**           | Prettier 3.4                                   |
| **Unit tests**           | Jest 29 + ts-jest                              |
| **E2E tests (backend)**  | supertest                                      |
| **E2E tests (frontend)** | Playwright 1.44                                |
| **Proto → types**        | ts-proto 2.x                                   |
| **Pre-commit hooks**     | Husky + lint-staged                            |

### Infrastructure

- **Cloud Storage**: AWS S3 (`@aws-sdk/client-s3`)
- **Protocol Buffers**: gRPC with proto3

---

## Project Structure

### Monorepo Layout

```
the-hive-nest/
├── apps/
│   ├── api-gateway-service/   # HTTP entry point → routes gRPC to domain services
│   ├── property-service/      # Property domain (Prisma + gRPC server)
│   ├── file-service/          # File management (AWS S3)
│   ├── reference-service/     # Reference / lookup data
│   ├── virtual-tour-service/  # Virtual tour domain
│   ├── registry-service/      # Service discovery + health monitoring
│   ├── template-service/      # Template domain
│   └── web/                   # Next.js frontend
└── packages/
    ├── common/                # Interceptors, filters, base CRUD service, Prisma module, DTOs
    ├── property/              # Property proto + generated types + gRPC client
    ├── identity/              # Identity proto + gRPC client
    ├── files/                 # Files proto + gRPC client
    ├── reference/             # Reference proto + gRPC client
    ├── vitual-tour/           # Virtual-tour proto + gRPC client (note: typo in dir name)
    ├── template/              # Template package
    ├── registry/              # Registry service client + HiveServiceModule
    ├── authorization/         # OpenFGA integration
    ├── utils/                 # Utility functions, server config helpers
    ├── ui/                    # Shared React components
    ├── eslint-config/         # Shared ESLint flat configs
    ├── jest-config/           # Shared Jest configs (nest / nest-e2e / base)
    ├── typescript-config/     # Shared tsconfig bases
    └── tools/                 # scaffold-resource CLI + hive-gen
```

### Service Directory Layout

```
apps/[service-name]/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── app.controller.ts
│   ├── app.service.ts
│   ├── [feature]/
│   │   ├── [feature].module.ts
│   │   ├── [feature].controller.ts
│   │   ├── [feature].service.ts
│   │   └── [feature].controller.spec.ts
│   └── prisma/
│       ├── prisma.service.ts
│       └── prisma.config.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── generated/
│   └── prisma/            # Prisma client output (not committed)
├── test/
│   ├── app.e2e-spec.ts
│   └── jest-e2e.js        # Requires @hive/jest-config/nest-e2e
├── jest.config.js         # Requires @hive/jest-config/nest
├── package.json
├── tsconfig.json
└── nest-cli.json
```

### Domain Package Layout

```
packages/[domain]/
├── src/
│   ├── index.ts
│   ├── proto/
│   │   ├── [domain].service.proto
│   │   ├── [domain].message.proto
│   │   ├── [domain].model.proto
│   │   └── common.message.proto
│   ├── types/             # Generated TypeScript types (run `pnpm gen`)
│   ├── dto/               # Zod schemas + DTO classes
│   ├── client/            # Injectable gRPC client
│   └── constants/         # Package name + proto path constants
├── scripts/
│   └── generate-types.js  # Runs protoc → writes src/types/
├── jest.config.js
├── package.json
└── tsconfig.json
```

---

## Code Patterns & Conventions

### Naming

| Element               | Convention          | Example                                                          |
| --------------------- | ------------------- | ---------------------------------------------------------------- |
| Files                 | kebab-case          | `properties.controller.ts`                                       |
| Classes               | PascalCase + suffix | `PropertiesController`, `PropertiesService`, `CreatePropertyDto` |
| Variables / functions | camelCase           | `propertyService`, `createProperty`                              |
| Constants             | UPPER_SNAKE_CASE    | `REQUIRE_ACTIVE_ORGANIZATION_KEY`                                |
| Package names         | `@hive/[name]`      | `@hive/property`, `@hive/common`                                 |

### Module Pattern

```typescript
@Module({
  imports: [HiveServiceModule.forFeature([HivePropertyServiceClient])],
  controllers: [FeatureController],
})
export class FeatureModule {}
```

### Controller Pattern

```typescript
@Controller('resources')
export class ResourcesController {
  constructor(private readonly propertyService: HivePropertyServiceClient) {}

  @Get('/')
  @RequireOrganizationPermission({ resource: ['read'] })
  @UseInterceptors(ApiListTransformInterceptor)
  @ApiOperation({ summary: 'Query resources' })
  @ApiOkResponse({ type: QueryResourceResponseDto })
  @ApiErrorsResponse()
  queryResources(
    @Query() query: QueryResourceDto,
    @Session() { session, user }: UserSession,
  ) {
    return this.propertyService.resources.queryResources({
      queryBuilder: {
        limit: query.limit,
        page: query.page,
        orderBy: query.orderBy,
        v: query.v,
      },
      context: {
        organizationId: session.activeOrganizationId,
        userId: user.id,
      },
    });
  }

  @Post('/')
  @RequireOrganizationPermission({ resource: ['create'] })
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiCreatedResponse({ type: GetResourceResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  createResource(
    @Body() body: CreateResourceDto,
    @Query() query: CustomRepresentationQueryDto,
    @Session() { session, user }: UserSession,
  ) {
    return this.propertyService.resources.createResource({
      ...body,
      context: {
        organizationId: session.activeOrganizationId,
        userId: user.id,
      },
    });
  }

  @Get('/:id')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOkResponse({ type: GetResourceResponseDto })
  @ApiErrorsResponse()
  getResource(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.propertyService.resources.getResource({ id, v: query.v });
  }

  @Patch('/:id')
  @RequireOrganizationPermission({ resource: ['update'] })
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOkResponse({ type: GetResourceResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  updateResource(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateResourceDto,
    @Query() query: CustomRepresentationQueryDto,
    @Session() { session, user }: UserSession,
  ) {
    return this.propertyService.resources.updateResource({
      id,
      ...body,
      context: {
        organizationId: session.activeOrganizationId,
        userId: user.id,
      },
    });
  }

  @Delete('/:id')
  @RequireOrganizationPermission({ resource: ['delete'] })
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOkResponse({ type: GetResourceResponseDto })
  @ApiErrorsResponse()
  deleteResource(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DeleteQueryDto,
    @Session() { session, user }: UserSession,
  ) {
    return this.propertyService.resources.deleteResource({
      id,
      purge: query.purge,
      context: {
        organizationId: session.activeOrganizationId,
        userId: user.id,
      },
    });
  }
}
```

### DTO Patterns

```typescript
// Query DTO — extends shared QueryBuilderSchema
export const QueryResourceSchema = z.object({
  ...QueryBuilderSchema.shape,
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});
export class QueryResourceDto extends createZodDto(QueryResourceSchema) {}

// Create / Update DTOs
export const ResourceSchema = z.object({
  name: z.string().min(1, 'Required'),
  description: z.string().optional(),
});
export class CreateResourceDto extends createZodDto(ResourceSchema) {}
export class UpdateResourceDto extends createZodDto(ResourceSchema.partial()) {}

// Response DTO (Swagger)
export class GetResourceResponseDto implements Resource {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}
```

### Interceptors

| Interceptor                     | Use on                                                     |
| ------------------------------- | ---------------------------------------------------------- |
| `ApiListTransformInterceptor`   | GET list endpoints — wraps in `{ results, totalCount, … }` |
| `ApiDetailTransformInterceptor` | GET detail / POST / PATCH / DELETE — extracts `data` field |

---

## Service Communication

### Protocol Buffer Conventions

Proto files live in `packages/[domain]/src/proto/`.

| File                     | Purpose                                          |
| ------------------------ | ------------------------------------------------ |
| `[domain].service.proto` | RPC service definition                           |
| `[domain].message.proto` | Request / response messages                      |
| `[domain].model.proto`   | Data model messages                              |
| `common.message.proto`   | `QueryBuilder`, `RequestContext` shared messages |

```protobuf
syntax = "proto3";
import "common.message.proto";
import "[domain].model.proto";

message QueryResourceRequest {
  QueryBuilder  query_builder = 1;
  RequestContext context      = 2;
}

message QueryResourceResponse {
  repeated Resource data = 1;
  string metadata        = 2; // JSON — pagination info
}

service ResourceService {
  rpc QueryResources (QueryResourceRequest)  returns (QueryResourceResponse);
  rpc GetResource    (GetResourceRequest)    returns (GetResourceResponse);
  rpc CreateResource (CreateResourceRequest) returns (GetResourceResponse);
  rpc UpdateResource (UpdateResourceRequest) returns (GetResourceResponse);
  rpc DeleteResource (DeleteResourceRequest) returns (GetResourceResponse);
}
```

Run `pnpm --filter @hive/[domain] gen` after changing any `.proto` file to regenerate TypeScript types.

### Adding a New RPC Method (full workflow)

1. Add message defs to the relevant `.proto` file
2. `pnpm --filter @hive/[domain] gen` — regenerates `src/types/`
3. Export new types from `packages/[domain]/src/types/index.ts`
4. Add a method to the client service (`packages/[domain]/src/client/hive-[domain]-client.service.ts`)
5. Implement the method in the domain service controller (`@GrpcMethod`)
6. Implement the method in the domain service service
7. Add REST endpoint + Swagger decorators in the API Gateway controller

> Steps 1–2 are automated. Steps 3–7 are manual (or use `pnpm scaffold` for steps 5–7).

### gRPC Client Usage

```typescript
// Injected into API Gateway controller
constructor(private readonly propertyService: HivePropertyServiceClient) {}

// Called via the client's resource namespace
this.propertyService.resources.queryResources({ queryBuilder: {...}, context: {...} });
```

### Service Registry

Services register themselves on startup via `HiveServiceModule.forRoot(...)`.  
The API Gateway discovers services via the registry client, which uses `loadBalance()` for per-call resolution.

```typescript
HiveServiceModule.forRoot({
  enableHeartbeat: true,
  services: [],
  client: {
    useFactory: (config, http, grpc) => ({
      service: {
        name: config.serviceName,
        version: config.serviceVersion,
        tags: ['http', 'grpc'],
        endpoints: [
          { host: http.host, port: http.port, protocol: 'http', metadata: {} },
          { host: grpc.host, port: grpc.port, protocol: 'grpc', metadata: {} },
        ],
      },
    }),
    inject: [
      RegistryClientConfig,
      HTTP_SERVER_CONFIG_TOKEN,
      GRPC_SERVER_CONFIG_TOKEN,
    ],
    providers: [HTTPServerConfigProvider, GRPCServerConfigProvider],
  },
});
```

---

## Data Layer

### Prisma v7

Each service owns its own schema at `apps/[service]/prisma/schema.prisma`.  
Connection is managed via `prisma.config.ts` — there is **no `url` field** in the datasource block.

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
  // url is intentionally absent — injected via PrismaPg adapter at runtime
}
```

### Prisma Module (shared from `@hive/common`)

Each service only needs two files:

```typescript
// src/prisma/prisma.service.ts
import { Injectable } from '@nestjs/common';
import { createPrismaService } from '@hive/common';
import { PrismaClient } from '../../generated/prisma/client';

@Injectable()
export class PrismaService extends createPrismaService(PrismaClient) {}
```

```typescript
// src/prisma/prisma.config.ts
import { Configuration, Value } from '@itgorillaz/configify';
import z from 'zod';

@Configuration()
export class PrismaConfig {
  @Value('DATABASE_URL', { parse: z.url({}).parse })
  databaseUrl: string;
}
```

Wire it in `app.module.ts`:

```typescript
PrismaModule.forRootAsync({
  global: true,
  service: PrismaService,
  inject: [PrismaConfig],
  useFactory: (config: PrismaConfig) => ({
    adapter: new PrismaPg({ connectionString: config.databaseUrl }),
  }),
}),
```

### Model Conventions

- `@@map("table_name")` for explicit table name mapping
- `@db.Uuid` for UUID fields; `@db.Date` for date-only fields
- `voided Boolean @default(false)` for soft deletes
- Always include `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt`

### Database Commands

```bash
pnpm --filter @hive/[service] db:migrate    # Create + apply migration (prompts for name)
pnpm --filter @hive/[service] db:generate   # Regenerate Prisma client after schema change
pnpm db:generate                            # Regenerate all Prisma clients at once
```

---

## API Design Patterns

### REST Conventions

- **Plural nouns**: `/properties`, `/users`, `/files`
- **Nested resources**: `/properties/:id/amenities`
- **HTTP verbs**: GET (list/detail), POST (create), PATCH (partial update), DELETE (soft delete by default)

### Query Parameters

| Parameter       | Purpose                                 |
| --------------- | --------------------------------------- |
| `page`, `limit` | Pagination                              |
| `orderBy`       | Sort: `name:asc,createdAt:desc`         |
| `v`             | Custom field selection (representation) |
| Domain-specific | `status`, `search`, etc.                |

### Response Format

**List:**

```json
{ "results": [...], "totalCount": 100, "currentPage": 1, "pageSize": 20, "totalPages": 5 }
```

**Detail:**

```json
{ "id": "...", "name": "...", "createdAt": "...", "updatedAt": "..." }
```

### Swagger

- `@ApiOperation({ summary: '...' })` — operation description
- `@ApiOkResponse({ type: ResponseDto })` — 200 response
- `@ApiCreatedResponse({ type: ResponseDto })` — 201 response
- `@ApiErrorsResponse({ badRequest: true })` — standard error responses

---

## Authentication & Authorization

### Authentication (Better Auth)

Configured in `apps/api-gateway-service/src/auth/`. Auth endpoints live at `/api/auth/*`.

Sessions are stored in the database and include `activeOrganizationId` and `activeTeamId`.  
Use the `@Session()` decorator to access the session in controllers:

```typescript
@Get('/')
@OptionalAuth()
queryResources(@Session() userSession?: UserSession) {
  // userSession = { session, user }
}
```

Better Auth schema is regenerated with:

```bash
pnpm --filter @hive/api-gateway-service auth:gen
```

### Authorization (OpenFGA)

`@hive/authorization` wraps the OpenFGA SDK. ACL definitions are in `packages/authorization/auth.openfga`.

**Guards (applied globally in api-gateway):**

- `RequireActiveOrganizationGuard` — ensures an active organisation is set in the session
- `RequireOrganizationPermissionsGuard` — checks organisation-level permissions via OpenFGA
- `RequireSystemPermissionsGuard` — checks system-level permissions

**Decorators:**

```typescript
@RequireOrganizationPermission({ property: ['create'] })
@RequireOrganizationPermission({ property: ['read', 'update'] })
@RequireSystemPermission({ admin: ['manage'] })
@OptionalAuth()
```

### Context Propagation

Always pass `RequestContext` in gRPC calls:

```typescript
context: {
  organizationId: session.activeOrganizationId,
  userId: user.id,
}
```

---

## Package Development

### New Package Checklist

1. Create `packages/[name]/` directory
2. `package.json` — name `@hive/[name]`, add `exports`, workspace peer deps
3. `tsconfig.json` extending `@hive/typescript-config/nestjs` (or `base`)
4. `jest.config.js` — `module.exports = require('@hive/jest-config/nest')`
5. `eslint.config.mjs` — import from `@hive/eslint-config/library`
6. `src/index.ts` — barrel exports

### package.json Pattern

```json
{
  "name": "@hive/[name]",
  "version": "0.0.1",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "dev": "pnpm build --watch",
    "build": "tsc -b -v",
    "clean": "rm -rf dist",
    "test": "jest",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix"
  }
}
```

### gRPC Domain Package Constants

```typescript
// src/constants/index.ts
export const DOMAIN_PACKAGE_NAME = 'hive.domain.v1';
export const DOMAIN_PACKAGE = {
  V1: {
    NAME: DOMAIN_PACKAGE_NAME,
    PROTO_PATH: join(__dirname, '../proto/domain.service.proto'),
  },
};
```

---

## Development Workflow

### Prerequisites

- Node.js ≥ 18
- pnpm 9 — `corepack enable && corepack prepare pnpm@latest --activate`
- PostgreSQL database

### Initial Setup

```bash
# Install all dependencies and build shared packages
pnpm install

# Generate Prisma clients
pnpm db:generate

# Run database migrations for each service
pnpm --filter @hive/api-gateway-service db:migrate
pnpm --filter @hive/property-service db:migrate
# … repeat for each service with a schema

# Start all services
pnpm dev
```

### Common Commands

```bash
pnpm dev                                          # All services in watch mode
pnpm build                                        # Build everything
pnpm test                                         # All unit tests
pnpm test:e2e                                     # All E2E tests
pnpm lint                                         # ESLint (turbo, per-package)
pnpm format                                       # Prettier across all files

# Single service / package
pnpm --filter @hive/api-gateway-service dev
pnpm --filter @hive/property build
pnpm --filter @hive/property gen                  # Regenerate proto types
pnpm --filter @hive/api-gateway-service db:generate
pnpm --filter @hive/api-gateway-service db:migrate
pnpm --filter @hive/api-gateway-service auth:gen  # Regenerate Better Auth schema
```

### Scaffolding a New Resource

```bash
pnpm scaffold --resource <Name> --package <pkg> --service <SERVICE_NAME>
# Example
pnpm scaffold --resource Review --package property --service PROPERTIES_SERVICE_NAME
```

Generates: DTO, domain service, domain controller, domain module, gateway controller, gateway module.  
See [Adding a New RPC Method](#adding-a-new-rpc-method-full-workflow) for the remaining manual steps.

---

## Testing Patterns

### Unit Tests

- Files named `*.spec.ts`, co-located with source
- Config: `jest.config.js` → `require('@hive/jest-config/nest')`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AmenitiesService } from './amenities.service';

describe('AmenitiesService', () => {
  let service: AmenitiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AmenitiesService],
    }).compile();
    service = module.get<AmenitiesService>(AmenitiesService);
  });

  it('should be defined', () => expect(service).toBeDefined());
});
```

### E2E Tests

- Files: `test/app.e2e-spec.ts` in each service
- Config: `test/jest-e2e.js` → `require('@hive/jest-config/nest-e2e')`
- Uses `supertest` for HTTP assertions

```typescript
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  it('GET /', () => request(app.getHttpServer()).get('/').expect(200));
});
```

### Frontend Tests

- Jest + React Testing Library for unit/component tests
- Playwright for E2E (`playwright.config.ts` in `apps/web/`)

---

## Tooling

### Jest — `@hive/jest-config`

Shared configs in `packages/jest-config/`. No inline jest config lives in any `package.json`.

| Export                       | Use                                |
| ---------------------------- | ---------------------------------- |
| `@hive/jest-config/nest`     | Unit tests — all apps and packages |
| `@hive/jest-config/nest-e2e` | E2E tests — `test/` directory      |
| `@hive/jest-config/base`     | Base config for custom setups      |

To change jest behaviour globally, edit `packages/jest-config/nest.js`.

### ESLint — `@hive/eslint-config`

All configs use the **flat config format** (`eslint.config.mjs`). Every app and package has its own config; the root config ignores `apps/**` and `packages/**`.

| Export                               | Use                           |
| ------------------------------------ | ----------------------------- |
| `@hive/eslint-config/nest`           | NestJS apps                   |
| `@hive/eslint-config/library`        | Shared packages               |
| `@hive/eslint-config/next`           | Next.js app                   |
| `@hive/eslint-config/react-internal` | React packages                |
| `@hive/eslint-config/prettier-base`  | Adds Prettier rules to ESLint |

### TypeScript — `@hive/typescript-config`

| File                 | Use                             |
| -------------------- | ------------------------------- |
| `nestjs.json`        | NestJS apps and packages        |
| `nextjs.json`        | Next.js app                     |
| `react-library.json` | React component packages        |
| `base.json`          | Base (strict, ES2022, NodeNext) |

### Pre-commit Hooks

Managed by **Husky** + **lint-staged**. Installed automatically via `pnpm install` (`prepare` script).

What runs on every `git commit`:

- `prettier --write` on all staged `ts / tsx / js / mjs / json / md / css` files

ESLint runs in CI via `pnpm lint` (turbo, per-package).

To skip in an emergency: `git commit --no-verify`

### Turbo Remote Caching (optional)

```bash
npx turbo login
npx turbo link
```

---

## Configuration Management

All services use `@itgorillaz/configify` for typed, validated configuration. Required env vars are declared as class properties with Zod validators — no bare `process.env` reads in service code.

```typescript
@Configuration()
export class AppConfig {
  @Value('PORT', { parse: z.coerce.number().parse })
  port: number;

  @Value('GRPC_HOST')
  grpcHost: string;

  @Value('GRPC_PORT', { parse: z.coerce.number().parse })
  grpcPort: number;
}
```

### Common Environment Variables

| Variable                  | Purpose                      |
| ------------------------- | ---------------------------- |
| `DATABASE_URL`            | PostgreSQL connection string |
| `HTTP_HOST` / `HTTP_PORT` | HTTP server bind address     |
| `GRPC_HOST` / `GRPC_PORT` | gRPC server bind address     |

---

## Build & Deployment

### Build Order

Turborepo handles dependency ordering automatically via `dependsOn: ["^build"]`:

1. Shared packages build first
2. Domain services build after their package dependencies
3. Frontend builds last

### Build Commands

```bash
pnpm build                                        # Build everything
pnpm --filter @hive/api-gateway-service build     # Build a single service
pnpm --filter @hive/api-gateway-service start:prod
```

### Build Outputs

- Packages and services: `dist/`
- Frontend: `.next/`
- Prisma clients: `generated/prisma/` (per service, not committed)

---

## Rules & Guidelines

### TypeScript

- Strict mode always enabled
- No `any` — use `unknown` or proper generics
- Prefer `async/await` over raw Promises
- Import from workspace packages with `@hive/` scope; never relative cross-package imports

### API Design

- Follow REST conventions and response format strictly
- Document every endpoint with Swagger decorators
- Validate all inputs with Zod; never trust raw request data

### Service Communication

- gRPC for all service-to-service calls
- Always pass `RequestContext` (`organizationId`, `userId`) in gRPC requests
- Update `.proto` files first; regenerate types before implementing

### Database

- Use migrations for every schema change (`db:migrate`)
- Never add `url` to the Prisma datasource block — use the `PrismaPg` adapter
- Always include `voided`, `createdAt`, `updatedAt` on domain models
- Soft delete via `voided`; hard delete only via explicit `purge` flag

### Security

- Protect every endpoint with an auth decorator (`@RequireOrganizationPermission`, `@OptionalAuth`)
- Never commit secrets — use `.env` files excluded from git

### Testing

- Unit tests (`*.spec.ts`) alongside source; E2E tests in `test/`
- Tests must be independent and isolated

### Git / Code Style

- Prettier runs automatically on staged files (pre-commit hook)
- ESLint must pass before merging (`pnpm lint`)
- Use descriptive branch names and commit messages
- Always commit migration files alongside schema changes

---

**Last updated:** 2026-06-01
