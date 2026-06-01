# The Hive Nest — Project Specification & Guidelines

## Table of Contents

1. [Project Overview](#project-overview)
2. [Key Concepts](#key-concepts)
3. [Architecture](#architecture)
4. [Technology Stack](#technology-stack)
5. [Project Structure](#project-structure)
6. [Code Patterns & Conventions](#code-patterns--conventions)
7. [Service Communication](#service-communication)
8. [Data Layer](#data-layer)
9. [Query Builder System](#query-builder-system)
10. [API Design Patterns](#api-design-patterns)
11. [Authentication & Authorization](#authentication--authorization)
12. [Package Development](#package-development)
13. [Development Workflow](#development-workflow)
14. [Testing Patterns](#testing-patterns)
15. [Tooling](#tooling)
16. [Configuration Management](#configuration-management)
17. [Build & Deployment](#build--deployment)
18. [Rules & Guidelines](#rules--guidelines)

---

## Project Overview

**The Hive Nest** is the backend of Havena — a multi-tenant SaaS platform for property management. Landlords, property managers, and agencies belong to **organisations**. Each organisation manages its own properties, listings, files, virtual tours, and team members in complete isolation from other organisations.

The system is built as NestJS microservices communicating over gRPC, with a single API Gateway as the public HTTP entry point.

---

## Key Concepts

Before reading the architecture or code patterns, understand these five concepts. They appear everywhere.

### 1. Domain Package vs Domain Service

Every domain is split into two distinct pieces:

|                | Domain Package                                       | Domain Service                              |
| -------------- | ---------------------------------------------------- | ------------------------------------------- |
| **Location**   | `packages/property/`                                 | `apps/property-service/`                    |
| **What it is** | Shared library                                       | Runnable process                            |
| **Contains**   | Proto files, generated types, injectable gRPC client | Business logic, Prisma queries, gRPC server |
| **Used by**    | `api-gateway-service`                                | Itself only                                 |
| **Built when** | Before apps (packages first)                         | After its package dependency                |

The API Gateway imports `@hive/property` (the package) to get the typed gRPC client. The `property-service` app implements the gRPC server using the same proto definitions. They share types through the proto — **neither can diverge without the other breaking**.

### 2. Multi-Tenancy

Every piece of data belongs to an **organisation**. There is no globally visible resource by default.

When a user logs in, their session records an `activeOrganizationId`. This ID travels with every gRPC call as part of `RequestContext`. Domain services use it to scope all Prisma queries — a `findMany` on properties always filters by `organizationId`.

Always include context in gRPC calls:

```typescript
context: {
  organizationId: session.activeOrganizationId,
  userId: user.id,
}
```

### 3. Service Registry and Dynamic Ports

Domain services do **not** have fixed ports. On startup, each service:

1. Binds to a free port via `getFreePort()`
2. Registers itself with `registry-service` (always at port `4001`) including its resolved host and port
3. The API Gateway resolves addresses at call time via `loadBalance()`

You never hardcode gRPC addresses. If `registry-service` is not running when a domain service starts, that service cannot register and the gateway cannot reach it.

### 4. The `identity` Domain

There is **no separate `identity-service` process**. User, organisation, member, and invitation data lives in `api-gateway-service`'s own PostgreSQL database and is managed by **Better Auth**.

`@hive/identity` is a gRPC package that provides typed interfaces and an injectable client — but the server side is built into the api-gateway itself. The package exports the types and client used when the gateway exposes identity data through REST endpoints (`/identity/users`, `/identity/organizations`, etc.).

### 5. The `v` Representation Parameter

Every list and detail endpoint accepts a `v` query parameter that controls which nested relations are returned. This avoids creating multiple endpoints for the same resource with different field sets.

```
# Return a property with its owner's id and email, and include its amenities
GET /properties/123?v=custom:include(owner:select(id, email), amenities)

# Return only id and name
GET /properties/123?v=custom:select(id, name)

# Omit specific fields
GET /properties/123?v=custom:omit(internalNotes)
```

The gateway passes the `v` string through the gRPC call to the domain service, which uses `CustomRepresentationService` to build a Prisma `include`/`select`/`omit` query from it. Server-side allow/deny patterns prevent abuse (e.g. `denyPatterns: ['**.passwordHash']`).

---

## Architecture

### Why This Architecture

**Why a gateway?** All authentication, authorisation, and HTTP concerns live in one place. Domain services contain no HTTP code, no session handling, no Swagger — only business logic.

**Why gRPC between services?** Protocol Buffers enforce a typed contract between gateway and domain service. Changing a proto file without updating both sides produces a compile error, not a runtime bug.

**Why a service registry?** Services start on dynamic ports to avoid collisions in local development and container orchestration. The registry provides a single source of truth for "where is the property-service right now?"

### System Diagram

```
Browser / API client
       │  HTTP (port 8090)
       ▼
┌─────────────────────────────────────────────┐
│            api-gateway-service              │
│  - HTTP/REST endpoints (NestJS controllers) │
│  - Auth: Better Auth + OpenFGA              │
│  - Identity data (users, orgs, members)     │
│  - Routes all other calls via gRPC          │
└────┬────────────────────────────────────────┘
     │ gRPC (dynamic ports, resolved via registry)
     ├──► property-service    ──► PostgreSQL (hive_property)
     ├──► file-service         ──► PostgreSQL (hive_files) + S3
     ├──► reference-service    ──► PostgreSQL (hive_reference)
     ├──► virtual-tour-service ──► PostgreSQL (hive_virtual_tour)
     └──► template-service
     │
     └──► registry-service  (port 4001) ──► Redis
               ↑  all services register here on startup
```

### Service Responsibilities

| Service                | Responsibility                                       | Persistence          |
| ---------------------- | ---------------------------------------------------- | -------------------- |
| `api-gateway-service`  | HTTP API, auth, identity, routing                    | PostgreSQL (auth DB) |
| `property-service`     | Properties, amenities, categories, media, attributes | PostgreSQL           |
| `file-service`         | File upload/download metadata, S3 integration        | PostgreSQL + S3      |
| `reference-service`    | Countries, regions, cities, address hierarchy        | PostgreSQL           |
| `virtual-tour-service` | Virtual tour links and metadata                      | PostgreSQL           |
| `template-service`     | Reusable templates                                   | None                 |
| `registry-service`     | Service discovery, health monitoring                 | Redis                |

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

|                             |                                                              |
| --------------------------- | ------------------------------------------------------------ |
| **Framework**               | NestJS 11.x                                                  |
| **Microservices transport** | `@nestjs/microservices` (gRPC)                               |
| **Database ORM**            | Prisma 7.x with `@prisma/adapter-pg`                         |
| **Validation**              | Zod 4.x + nestjs-zod 5.x (beta)                              |
| **API docs**                | `@nestjs/swagger` (Swagger UI `/api`, Scalar `/api-doc`)     |
| **Authentication**          | Better Auth (`better-auth` + `@thallesp/nestjs-better-auth`) |
| **Authorization**           | OpenFGA via `@hive/authorization`                            |
| **Scheduling**              | `@nestjs/schedule`                                           |
| **Config**                  | `@itgorillaz/configify`                                      |

### Frontend

|               |              |
| ------------- | ------------ |
| **Framework** | Next.js 14.1 |
| **UI**        | React 18.2   |

### Development Tools

|                          |                                                |
| ------------------------ | ---------------------------------------------- |
| **Linting**              | ESLint 9.x — flat config (`eslint.config.mjs`) |
| **Formatting**           | Prettier 3.4                                   |
| **Unit tests**           | Jest 29 + ts-jest                              |
| **E2E tests (backend)**  | supertest                                      |
| **E2E tests (frontend)** | Playwright 1.44                                |
| **Proto → types**        | ts-proto 2.x                                   |
| **Pre-commit hooks**     | Husky + lint-staged                            |

---

## Project Structure

### Monorepo Layout

```
the-hive-nest/
├── apps/
│   ├── api-gateway-service/    # HTTP entry point — the only public-facing service
│   ├── property-service/       # Property domain: properties, amenities, media, categories
│   ├── file-service/           # File management (S3 + metadata)
│   ├── reference-service/      # Geo reference: countries, cities, address hierarchy
│   ├── virtual-tour-service/   # Virtual tour metadata
│   ├── registry-service/       # Service discovery (Redis, port 4001)
│   ├── template-service/       # Reusable templates
│   └── web/                    # Next.js 14 frontend
└── packages/
    ├── common/                 # Interceptors, filters, Prisma module, query builder services
    ├── property/               # Property proto + generated types + gRPC client
    ├── identity/               # User/org/member proto + gRPC client
    ├── files/                  # Files proto + gRPC client
    ├── reference/              # Reference proto + gRPC client
    ├── vitual-tour/            # Virtual-tour proto + gRPC client  (typo in dir name)
    ├── template/               # Template package
    ├── registry/               # Registry client + HiveServiceModule
    ├── authorization/          # OpenFGA integration
    ├── utils/                  # Server config helpers, utilities
    ├── ui/                     # Shared React components
    ├── eslint-config/          # Shared ESLint flat configs
    ├── jest-config/            # Shared Jest configs (nest / nest-e2e / base)
    ├── typescript-config/      # Shared tsconfig bases
    └── tools/                  # scaffold-resource CLI + hive-gen
```

### Service Directory Layout

```
apps/[service-name]/
├── src/
│   ├── main.ts                    # Bootstrap
│   ├── app.module.ts              # Root module
│   ├── [feature]/
│   │   ├── [feature].module.ts
│   │   ├── [feature].controller.ts
│   │   ├── [feature].service.ts
│   │   └── [feature].controller.spec.ts
│   └── prisma/
│       ├── prisma.service.ts      # extends createPrismaService(PrismaClient)
│       └── prisma.config.ts       # @Configuration with DATABASE_URL
├── prisma/
│   ├── schema.prisma              # datasource has NO url field
│   └── migrations/
├── generated/
│   └── prisma/                    # Prisma client output — not committed
├── test/
│   ├── app.e2e-spec.ts
│   └── jest-e2e.js                # module.exports = require('@hive/jest-config/nest-e2e')
├── jest.config.js                 # module.exports = require('@hive/jest-config/nest')
├── package.json
├── tsconfig.json
└── nest-cli.json
```

### Domain Package Layout

```
packages/[domain]/
├── src/
│   ├── index.ts                   # Barrel exports
│   ├── proto/
│   │   ├── [domain].service.proto  # RPC method signatures
│   │   ├── [domain].message.proto  # Request/response messages
│   │   ├── [domain].model.proto    # Data model types
│   │   └── common.message.proto    # QueryBuilder, RequestContext
│   ├── types/                     # Generated by `pnpm gen` — do not edit manually
│   ├── dto/                       # Zod schemas + DTO classes
│   ├── client/                    # Injectable gRPC client
│   └── constants/                 # Package name + proto path
├── scripts/
│   └── generate-types.js          # Runs protoc → writes src/types/
├── jest.config.js
├── package.json
└── tsconfig.json
```

---

## Code Patterns & Conventions

### Naming

| Element               | Convention          | Example                                     |
| --------------------- | ------------------- | ------------------------------------------- |
| Files                 | kebab-case          | `properties.controller.ts`                  |
| Classes               | PascalCase + suffix | `PropertiesController`, `CreatePropertyDto` |
| Variables / functions | camelCase           | `propertyService`, `createProperty`         |
| Constants             | UPPER_SNAKE_CASE    | `REQUIRE_ACTIVE_ORGANIZATION_KEY`           |
| Packages              | `@hive/[name]`      | `@hive/property`, `@hive/common`            |

### Module Pattern

Gateway feature modules declare which gRPC clients they need via `HiveServiceModule.forFeature()`:

```typescript
@Module({
  imports: [HiveServiceModule.forFeature([HivePropertyServiceClient])],
  controllers: [AmenitiesController],
})
export class AmenitiesModule {}
```

Domain service feature modules use standard NestJS module wiring — no `HiveServiceModule`.

### Controller Pattern (API Gateway)

This is the complete pattern. All five decorator groups on every method are required.

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
  @ApiOperation({ summary: 'Create resource' })
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
  @ApiOperation({ summary: 'Get resource' })
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
  @ApiOperation({ summary: 'Update resource' })
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
  @ApiOperation({ summary: 'Delete resource' })
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

**Interceptors:**

| Interceptor                     | Apply to                        | Effect                                                                         |
| ------------------------------- | ------------------------------- | ------------------------------------------------------------------------------ |
| `ApiListTransformInterceptor`   | GET list endpoints              | Wraps response in `{ results, totalCount, currentPage, pageSize, totalPages }` |
| `ApiDetailTransformInterceptor` | GET detail, POST, PATCH, DELETE | Extracts the `data` field from gRPC response                                   |

### DTO Patterns

DTOs live in the **domain package** (`packages/[domain]/src/dto/`) and are imported by the gateway controller.

```typescript
// Query DTO — extends the shared QueryBuilderSchema
export const QueryResourceSchema = z.object({
  ...QueryBuilderSchema.shape, // page, limit, orderBy, v
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});
export class QueryResourceDto extends createZodDto(QueryResourceSchema) {}

// Create / Update
export const ResourceSchema = z.object({
  name: z.string().min(1, 'Required'),
  description: z.string().optional(),
});
export class CreateResourceDto extends createZodDto(ResourceSchema) {}
export class UpdateResourceDto extends createZodDto(ResourceSchema.partial()) {}

// Response DTO — for Swagger documentation; actual data shape comes from the proto
export class GetResourceResponseDto implements Resource {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}
```

---

## Service Communication

### Protocol Buffer Conventions

Proto files in `packages/[domain]/src/proto/` are the **source of truth**. TypeScript types are generated from them, not hand-written.

| File                     | Purpose                                                      |
| ------------------------ | ------------------------------------------------------------ |
| `[domain].service.proto` | RPC method signatures                                        |
| `[domain].message.proto` | Request / response message types                             |
| `[domain].model.proto`   | Data model types returned in responses                       |
| `common.message.proto`   | `QueryBuilder`, `RequestContext` — shared across all domains |

```protobuf
syntax = "proto3";
import "common.message.proto";
import "[domain].model.proto";

message QueryResourceRequest {
  QueryBuilder   query_builder = 1;
  RequestContext context       = 2;
}

message QueryResourceResponse {
  repeated Resource data = 1;
  string metadata        = 2; // JSON string — pagination metadata
}

service ResourceService {
  rpc QueryResources (QueryResourceRequest)  returns (QueryResourceResponse);
  rpc GetResource    (GetResourceRequest)    returns (GetResourceResponse);
  rpc CreateResource (CreateResourceRequest) returns (GetResourceResponse);
  rpc UpdateResource (UpdateResourceRequest) returns (GetResourceResponse);
  rpc DeleteResource (DeleteResourceRequest) returns (GetResourceResponse);
}
```

After any `.proto` change: `pnpm --filter @hive/[domain] gen`

### Adding a New RPC Method (full workflow)

1. Add message definitions to `packages/[domain]/src/proto/*.proto`
2. `pnpm --filter @hive/[domain] gen` — regenerates `src/types/`
3. Export new types from `packages/[domain]/src/types/index.ts`
4. Add a method to `packages/[domain]/src/client/hive-[domain]-client.service.ts`
5. Implement in the domain service: `@GrpcMethod` controller method + service method
6. Add REST endpoint + Swagger decorators in `apps/api-gateway-service/src/[resource]/`

> Steps 1–2 are automated. Use `pnpm scaffold` to generate the boilerplate for steps 5–6.

### gRPC Client (in API Gateway)

The client groups methods by resource namespace:

```typescript
constructor(private readonly propertyService: HivePropertyServiceClient) {}

this.propertyService.properties.queryProperties({ ... });
this.propertyService.amenities.queryAmenities({ ... });
this.propertyService.categories.getCategory({ ... });
```

### Service Registry

Domain services register on startup. The gateway resolves addresses at call time:

```typescript
// In a domain service app.module.ts — registers this service
HiveServiceModule.forRoot({
  enableHeartbeat: true,
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

// In a gateway feature module — declares which client(s) this module uses
HiveServiceModule.forFeature([HivePropertyServiceClient]);
```

---

## Data Layer

### Prisma v7

Each service with persistence owns its own schema at `apps/[service]/prisma/schema.prisma`. Services share **no** schema and have no cross-service foreign keys.

**Critical: no `url` in the datasource block.** The connection string is injected at runtime via `PrismaPg`:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
  // url is intentionally absent — injected via PrismaPg adapter in app.module.ts
}
```

### Prisma Module (shared from `@hive/common`)

Each service needs exactly two files:

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

Wired in `app.module.ts`:

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

```prisma
model Property {
  id             String   @id @default(uuid()) @db.Uuid
  name           String
  organizationId String   @db.Uuid       // always present — multi-tenancy
  voided         Boolean  @default(false) // soft delete
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@map("property")
}
```

- `@@map("table_name")` — lowercase snake_case table names
- `@db.Uuid` — for all UUID fields
- `voided` — soft delete; hard delete only with explicit `purge: true` flag
- `organizationId` — on every tenant-scoped model

### Database Commands

```bash
pnpm --filter @hive/[service] db:migrate    # Create + apply migration (prompts for name)
pnpm --filter @hive/[service] db:generate   # Regenerate Prisma client
pnpm db:generate                            # Regenerate all Prisma clients at once
```

---

## Query Builder System

`@hive/common` provides three injectable services used in domain service implementations. They translate the standardised query parameters into Prisma query objects.

### `QueryBuilderSchema` — Standard Query Fields

Extend this in every query DTO:

```typescript
// Fields provided by QueryBuilderSchema:
// page?:    number  (min: 1)
// limit?:   number  (non-negative, server max: 120)
// orderBy?: string  (format: "name:asc,createdAt:desc" or "-name,createdAt")
// v?:       string  (representation DSL — see CustomRepresentationService)
export class QueryResourceDto extends createZodDto(
  z.object({ ...QueryBuilderSchema.shape /* domain fields */ }),
) {}
```

Other exported DTOs: `PaginationQueryDto`, `OrderQueryDto`, `CustomRepresentationQueryDto`, `SortAndRepresentationDto`, `DeleteQueryDto`.

### `PaginationService`

```typescript
// Returns { skip, take } for Prisma
const { skip, take } = this.paginationService.buildPaginationQuery(query);

// Returns pagination metadata
const meta = this.paginationService.buildPaginationControls(
  totalCount,
  url,
  query,
);
// → { totalCount, currentPage, pageSize, totalPages }
```

Defaults: `pageSize = 12`, `maxPageSize = 120`, `page = 1`.

### `SortService`

```typescript
// Parses "name:asc,createdAt:desc" or "-name,createdAt"
const orderBy = this.sortService.buildSortQuery(query.orderBy);
// → [{ name: 'asc' }, { createdAt: 'desc' }]
```

### `CustomRepresentationService` (the `v` parameter)

Builds a Prisma `include`/`select`/`omit` object from the `v` DSL string:

**DSL format:** `v=custom:<operation>(<fields>)` where operation is `include`, `select`, or `omit`, and fields support nesting.

```
v=custom:include(owner:select(id, email), amenities)
v=custom:select(id, name, createdAt)
v=custom:omit(internalNotes)
```

```typescript
const representation =
  this.representationService.buildCustomRepresentationQuery(query.v, {
    denyPatterns: ['**.passwordHash', '**.twoFactorSecret'], // always blocked
    autoOmit: {
      '**.user': ['passwordHash', 'twoFactorSecret'], // omitted from any user relation
    },
  });

await this.prisma.property.findMany({
  where: { organizationId, voided: false },
  orderBy,
  skip,
  take,
  ...representation, // spreads include / select / omit
});
```

---

## API Design Patterns

### REST Conventions

- **Plural nouns**: `/properties`, `/files`, `/amenities`
- **Nested resources**: `/properties/:id/amenities`
- **HTTP verbs**: GET (list/detail), POST (create), PATCH (partial update), DELETE (soft delete by default)

### Standard Query Parameters

| Parameter | Description               | Example                            |
| --------- | ------------------------- | ---------------------------------- |
| `page`    | Page number (1-based)     | `?page=2`                          |
| `limit`   | Items per page (max 120)  | `?limit=20`                        |
| `orderBy` | Sort fields               | `?orderBy=name:asc,createdAt:desc` |
| `v`       | Representation DSL        | `?v=custom:include(owner)`         |
| `purge`   | Hard delete (DELETE only) | `?purge=true`                      |

### Response Shapes

**List:**

```json
{
  "results": [...],
  "totalCount": 100,
  "currentPage": 1,
  "pageSize": 20,
  "totalPages": 5
}
```

**Detail / create / update / delete:**

```json
{ "id": "...", "name": "...", "createdAt": "...", "updatedAt": "..." }
```

### Swagger

Every endpoint needs all four Swagger decorators:

```typescript
@ApiOperation({ summary: 'Brief description' })
@ApiOkResponse({ type: ResponseDto })         // or @ApiCreatedResponse for POST
@ApiErrorsResponse()                           // standard 4xx/5xx shapes
// @ApiErrorsResponse({ badRequest: true })    // also adds 400
```

Swagger UI: `http://localhost:8090/api`
Scalar: `http://localhost:8090/api-doc`

---

## Authentication & Authorization

### Authentication (Better Auth)

Auth endpoints live at `/api/auth/*` and are handled by Better Auth.  
Configuration: `apps/api-gateway-service/src/auth/`

The session object available in every controller:

| Field                          | Type   | Description                     |
| ------------------------------ | ------ | ------------------------------- |
| `session.id`                   | string | Session ID                      |
| `session.activeOrganizationId` | string | Currently selected organisation |
| `session.activeTeamId`         | string | Currently selected team         |
| `user.id`                      | string | Authenticated user ID           |
| `user.email`                   | string | User email                      |
| `user.role`                    | string | System role                     |

Using the session in controllers:

```typescript
// Requires authentication + active organisation
@RequireOrganizationPermission({ resource: ['create'] })
createResource(@Session() { session, user }: UserSession) {
  // session.activeOrganizationId is guaranteed to be set
}

// Authentication optional — useful for public read endpoints
@OptionalAuth()
getResource(@Session() userSession?: UserSession) {
  // userSession may be undefined
}
```

Regenerate the Better Auth DB schema:

```bash
pnpm --filter @hive/api-gateway-service auth:gen
```

### Authorization (OpenFGA)

OpenFGA is a relationship-based access control (ReBAC) system. Instead of role checks (`if user.role === 'admin'`), permissions are modelled as tuples: _"user X has relation Y to object Z"_.

**Why ReBAC instead of RBAC?** It supports fine-grained resource-level permissions — a user can be blocked from a specific property even if their organisation role would otherwise grant access.

**The permission model** (`packages/authorization/auth.openfga`):

| Type           | Key relations                 | Notes                                           |
| -------------- | ----------------------------- | ----------------------------------------------- |
| `system`       | `super_user`                  | Bypasses all org and resource checks globally   |
| `organization` | `owner`, `admin`, `member`    | `owner` > `admin` > `member` hierarchy          |
| `property`     | `owner`, `manager`, `blocked` | `can_manage` = owner or manager AND NOT blocked |
| `file`         | same as property              |                                                 |
| `listing`      | same as property              |                                                 |

**Permission evaluation flow:**

```
Is user a system super_user?  → allow everything
Is user blocked on this resource? → deny
Does user have owner/manager/member on this resource's org? → allow/deny by role
```

**Guards (applied globally in api-gateway):**

| Guard                                 | Triggered by                          |
| ------------------------------------- | ------------------------------------- |
| `RequireActiveOrganizationGuard`      | Any route with org context            |
| `RequireOrganizationPermissionsGuard` | `@RequireOrganizationPermission(...)` |
| `RequireSystemPermissionsGuard`       | `@RequireSystemPermission(...)`       |

**Decorators:**

```typescript
@RequireOrganizationPermission({ property: ['create'] })
@RequireOrganizationPermission({ property: ['read', 'update'] })
@RequireSystemPermission({ admin: ['manage'] })
@OptionalAuth()
```

**Adding a new resource type to the permission model:**

1. Add the type to `packages/authorization/auth.openfga` with `can_manage`, `can_view`, `can_delete` relations
2. Write tuples when creating/sharing resources via `BaseAuthorizationService`

### Context Propagation

Pass `RequestContext` in every gRPC call. Domain services use it to scope Prisma queries to the current organisation:

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
2. `package.json` — name `@hive/[name]`, `exports` map, workspace peer deps
3. `tsconfig.json` extending `@hive/typescript-config/nestjs` (or `base`)
4. `jest.config.js` — `module.exports = require('@hive/jest-config/nest')`
5. `eslint.config.mjs` — import `@hive/eslint-config/library`
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

### Initial Setup

```bash
pnpm install           # install + build packages (postinstall) + install Husky hook
pnpm db:generate       # generate all Prisma clients

# Migrate services that have a database
pnpm --filter @hive/api-gateway-service db:migrate
pnpm --filter @hive/property-service db:migrate
pnpm --filter @hive/file-service db:migrate
pnpm --filter @hive/reference-service db:migrate
pnpm --filter @hive/virtual-tour-service db:migrate

pnpm dev               # start everything
```

### Common Commands

```bash
pnpm dev                                            # All services, watch mode
pnpm build                                          # Build everything
pnpm test                                           # All unit tests
pnpm test:e2e                                       # All E2E tests
pnpm lint                                           # ESLint (per-package via turbo)
pnpm format                                         # Prettier all files

pnpm --filter @hive/api-gateway-service dev         # Single service
pnpm --filter @hive/property gen                    # Regenerate proto types
pnpm --filter @hive/api-gateway-service db:migrate  # Run DB migration
pnpm --filter @hive/api-gateway-service auth:gen    # Regenerate Better Auth schema
```

### Scaffolding a New Resource

```bash
pnpm scaffold --resource <Name> --package <pkg> --service <SERVICE_NAME>
# Example
pnpm scaffold --resource Review --package property --service PROPERTIES_SERVICE_NAME
```

Generates: DTO, domain service, domain controller, domain module, gateway controller, gateway module.
Then follow [Adding a New RPC Method](#adding-a-new-rpc-method-full-workflow) for proto and client wiring.

---

## Testing Patterns

### Unit Tests

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

- Jest + React Testing Library — unit/component tests
- Playwright (`playwright.config.ts` in `apps/web/`) — E2E

---

## Tooling

### Jest — `@hive/jest-config`

No inline jest config in any `package.json`.

| Export                       | Use                                |
| ---------------------------- | ---------------------------------- |
| `@hive/jest-config/nest`     | Unit tests — all apps and packages |
| `@hive/jest-config/nest-e2e` | E2E tests — `test/` directory      |
| `@hive/jest-config/base`     | Base config for custom setups      |

To change jest behaviour globally, edit `packages/jest-config/nest.js`.

### ESLint — `@hive/eslint-config`

Flat config format everywhere (`eslint.config.mjs`). Root config ignores `apps/**` and `packages/**`.

| Export                               | Use             |
| ------------------------------------ | --------------- |
| `@hive/eslint-config/nest`           | NestJS apps     |
| `@hive/eslint-config/library`        | Shared packages |
| `@hive/eslint-config/next`           | Next.js app     |
| `@hive/eslint-config/react-internal` | React packages  |

### TypeScript — `@hive/typescript-config`

| File                 | Use                             |
| -------------------- | ------------------------------- |
| `nestjs.json`        | NestJS apps and packages        |
| `nextjs.json`        | Next.js app                     |
| `react-library.json` | React component packages        |
| `base.json`          | Base (strict, ES2022, NodeNext) |

### Pre-commit Hooks

Husky + lint-staged; installed via `pnpm install`.  
Runs `prettier --write` on all staged files.  
ESLint runs in CI via `pnpm lint`.

Skip in an emergency: `git commit --no-verify`

### Turbo Remote Caching (optional)

```bash
npx turbo login
npx turbo link
```

---

## Configuration Management

All services use `@itgorillaz/configify` for typed, validated configuration. The service fails to start if a required variable is missing or fails validation. No bare `process.env` reads in service code.

```typescript
@Configuration()
export class AppConfig {
  @Value('HTTP_PORT', { parse: z.coerce.number().parse })
  httpPort: number;

  @Value('GRPC_HOST')
  grpcHost: string;

  @Value('GRPC_PORT', { parse: z.coerce.number().parse })
  grpcPort: number;
}
```

### Environment Variables Reference

| Variable                   | Service                                              | Purpose                                               |
| -------------------------- | ---------------------------------------------------- | ----------------------------------------------------- |
| `DATABASE_URL`             | api-gateway, property, file, reference, virtual-tour | PostgreSQL connection string                          |
| `HTTP_PORT`                | api-gateway                                          | Public HTTP port (default: `8090`)                    |
| `BETTER_AUTH_SECRET`       | api-gateway                                          | Auth signing secret                                   |
| `BETTER_AUTH_URL`          | api-gateway                                          | Auth base URL (`http://localhost:8090` locally)       |
| `REDIS_DB_URL`             | registry                                             | Redis connection URL                                  |
| `STORAGE_STRATEGY`         | registry                                             | `redis`                                               |
| `SERVICE_TTL`              | registry                                             | Seconds before a registration expires (default: `60`) |
| `S3_ACCESS_KEY_ID`         | file                                                 | S3 access key                                         |
| `S3_SECRETE_ACCESS_KEY_ID` | file                                                 | S3 secret key (note: typo in the env var name)        |
| `S3_ENDPOINT`              | file                                                 | S3 endpoint (e.g. `http://localhost:9000` for MinIO)  |
| `S3_BUCKET_PUBLIC`         | file                                                 | Public bucket name                                    |
| `S3_BUCKET_PRIVATE`        | file                                                 | Private bucket name                                   |

---

## Build & Deployment

### Build Order

Turborepo handles ordering automatically via `dependsOn: ["^build"]`:

1. Shared packages first
2. Domain services after their package dependencies
3. Frontend last

### Commands

```bash
pnpm build                                          # Build everything
pnpm --filter @hive/api-gateway-service build       # Single service
pnpm --filter @hive/api-gateway-service start:prod  # Production start
```

### Outputs

- Packages and services: `dist/`
- Frontend: `.next/`
- Prisma clients: `generated/prisma/` (not committed)

---

## Rules & Guidelines

### TypeScript

- Strict mode always enabled
- No `any` — use `unknown` or proper generics
- Prefer `async/await` over raw Promises
- Import from `@hive/` workspace packages; never use relative paths across package boundaries

### API Design

- Follow REST conventions and response shapes strictly
- Every endpoint gets all four Swagger decorators
- Validate all inputs with Zod; never trust raw request data
- Never expose internal database errors in API responses

### Service Communication

- gRPC only for service-to-service calls — no HTTP between services
- Always pass `RequestContext` in every gRPC call
- Edit `.proto` first; regenerate and validate types before implementing

### Database

- Every schema change goes through `db:migrate` — no direct `ALTER TABLE`
- No `url` in the Prisma datasource block
- Every domain model includes `organizationId`, `voided`, `createdAt`, `updatedAt`
- Default delete is soft (`voided = true`); hard delete only via `purge: true`

### Security

- Every endpoint must have an auth decorator (`@RequireOrganizationPermission` or `@OptionalAuth`)
- Never commit `.env` files or secrets
- Use `denyPatterns` in `buildCustomRepresentationQuery` to block sensitive fields

### Testing

- Unit tests (`*.spec.ts`) alongside source; E2E tests in `test/`
- Tests must be independent — no shared state between test cases

### Git / Code Style

- Prettier auto-runs on staged files (pre-commit hook)
- ESLint must pass before merging (`pnpm lint`)
- Commit migration files alongside schema changes in the same commit

---

**Last updated:** 2026-06-01
