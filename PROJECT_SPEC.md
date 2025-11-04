# The Hive Nest - Project Specification & Guidelines

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
13. [Configuration Management](#configuration-management)
14. [Build & Deployment](#build--deployment)
15. [Rules & Guidelines](#rules--guidelines)

---

## Project Overview

**The Hive Nest** is a monorepo-based microservices architecture for property management. The system is built using:
- **Monorepo**: Turborepo with pnpm workspaces
- **Backend**: NestJS microservices with gRPC communication
- **Frontend**: Next.js web application
- **Database**: PostgreSQL with Prisma ORM
- **Service Discovery**: Custom registry service for service discovery and health monitoring

### Key Features
- Multi-tenant architecture with organization-based isolation
- Service-to-service communication via gRPC
- API Gateway pattern for HTTP endpoints
- Service registry for dynamic service discovery
- Role-based access control (RBAC) with OpenFGA
- Property management domain with virtual tours, files, references, and more

---

## Architecture

### Architecture Pattern
- **Microservices**: Each domain has its own service (property, identity, file, reference, virtual-tour, etc.)
- **API Gateway**: Single entry point (`api-gateway-service`) for all HTTP/REST requests
- **Service Registry**: Central registry service for service discovery and health monitoring
- **gRPC**: Primary communication protocol between services
- **Shared Packages**: Common code shared across services via workspace packages

### Service Architecture
```
┌─────────────────┐
│   Next.js Web   │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────────┐
│  API Gateway Service│
└────────┬────────────┘
         │ gRPC
         ├─────────────┐
         │             │
    ┌────▼────┐   ┌────▼────┐
    │ Property│   │ Identity│
    │ Service │   │ Service │
    └─────────┘   └─────────┘
         │             │
         └──────┬──────┘
                │
         ┌──────▼──────┐
         │   Registry  │
         │   Service  │
         └────────────┘
```

### Service Types
1. **API Gateway Service**: HTTP/REST endpoints, routes to microservices
2. **Domain Services**: Business logic for specific domains (property, identity, file, etc.)
3. **Registry Service**: Service discovery and health monitoring
4. **Supporting Services**: Template service, etc.

---

## Technology Stack

### Core Technologies
- **Runtime**: Node.js >= 18
- **Package Manager**: pnpm 8.15.5
- **Build Tool**: Turborepo 2.5.5
- **Language**: TypeScript 5.7.3

### Backend Stack
- **Framework**: NestJS 11.x
- **Microservices**: @nestjs/microservices (gRPC)
- **Database**: PostgreSQL with Prisma 6.14.0
- **Validation**: Zod 4.0.15 + nestjs-zod
- **API Docs**: Swagger/OpenAPI via @nestjs/swagger
- **Authentication**: Better Auth (@thallesp/nestjs-better-auth)
- **Authorization**: OpenFGA (via @hive/authorization)
- **Scheduling**: @nestjs/schedule
- **Configuration**: @itgorillaz/configify

### Frontend Stack
- **Framework**: Next.js 14.1.1
- **UI Library**: React 18.2.0
- **Testing**: Jest + Playwright

### Development Tools
- **Linting**: ESLint 9.18.0 with custom configs
- **Formatting**: Prettier 3.4.2
- **Testing**: Jest 29.7.0, Playwright 1.44.0
- **Type Generation**: ts-proto 2.7.7 (for gRPC)

### Infrastructure
- **Cloud Storage**: AWS S3 (via @aws-sdk/client-s3)
- **Protocol Buffers**: gRPC with proto3

---

## Project Structure

### Monorepo Structure
```
the-hive-nest/
├── apps/                          # Applications
│   ├── api-gateway-service/      # Main API Gateway (HTTP → gRPC)
│   ├── property-service/          # Property domain service
│   ├── file-service/              # File management service
│   ├── reference-service/         # Reference data service
│   ├── virtual-tour-service/      # Virtual tour service
│   ├── registry-service/          # Service discovery registry
│   ├── template-service/          # Template service
│   └── web/                       # Next.js frontend app
├── packages/                      # Shared packages
│   ├── common/                    # Common utilities, DTOs, interceptors
│   ├── property/                  # Property domain package (DTOs, gRPC clients)
│   ├── identity/                  # Identity domain package
│   ├── files/                     # Files domain package
│   ├── reference/                 # Reference domain package
│   ├── vitual-tour/               # Virtual tour domain package
│   ├── registry/                  # Registry service package
│   ├── authorization/             # Authorization utilities (OpenFGA)
│   ├── utils/                     # Utility functions
│   ├── ui/                        # Shared UI components
│   ├── eslint-config/             # ESLint configurations
│   ├── jest-config/               # Jest configurations
│   └── typescript-config/         # TypeScript configurations
├── package.json                   # Root package.json
├── pnpm-workspace.yaml            # pnpm workspace configuration
├── turbo.json                     # Turborepo configuration
└── tsconfig.json                  # Root TypeScript config
```

### Application Structure Pattern
Each NestJS service follows this structure:
```
service-name/
├── src/
│   ├── main.ts                    # Bootstrap file
│   ├── app.module.ts              # Root module
│   ├── app.controller.ts          # Root controller
│   ├── app.service.ts             # Root service
│   ├── config/                    # Configuration files
│   ├── [feature]/                 # Feature modules
│   │   ├── [feature].module.ts
│   │   ├── [feature].controller.ts
│   │   ├── [feature].service.ts
│   │   └── [feature].controller.spec.ts
│   └── prisma/                    # Prisma setup (if applicable)
│       ├── prisma.module.ts
│       └── prisma.service.ts
├── prisma/                        # Prisma schema and migrations
│   ├── schema.prisma
│   └── migrations/
├── test/                          # E2E tests
│   └── app.e2e-spec.ts
├── package.json
├── tsconfig.json
└── nest-cli.json
```

### Package Structure Pattern
Each shared package follows this structure:
```
package-name/
├── src/
│   ├── index.ts                   # Main exports
│   ├── proto/                     # Protocol buffer definitions
│   │   ├── *.service.proto        # Service definitions
│   │   ├── *.message.proto        # Message definitions
│   │   ├── *.model.proto          # Model definitions
│   │   └── common.message.proto   # Common messages
│   ├── types/                     # Generated TypeScript types from proto
│   ├── dto/                       # Data Transfer Objects
│   ├── client/                    # gRPC client code
│   ├── constants/                 # Constants
│   ├── config/                    # Configuration providers
│   └── [other]/                   # Domain-specific modules
├── scripts/                       # Build scripts
│   └── generate-types.js          # Proto to TypeScript generator
├── package.json
└── tsconfig.json
```

---

## Code Patterns & Conventions

### Naming Conventions

#### Files
- **Controllers**: `[feature].controller.ts`
- **Services**: `[feature].service.ts`
- **Modules**: `[feature].module.ts`
- **DTOs**: `[feature].dto.ts`
- **Guards**: `[feature].guards.ts`
- **Interceptors**: `[feature].interceptors.ts`
- **Tests**: `[feature].spec.ts` or `[feature].controller.spec.ts`
- **E2E Tests**: `app.e2e-spec.ts`

#### Classes
- **Controllers**: PascalCase with `Controller` suffix (e.g., `PropertiesController`)
- **Services**: PascalCase with `Service` suffix (e.g., `PropertiesService`)
- **DTOs**: PascalCase with `Dto` suffix (e.g., `CreatePropertyDto`, `QueryPropertyDto`)
- **Guards**: PascalCase with `Guard` suffix (e.g., `RequireOrganizationPermissionGuard`)
- **Interceptors**: PascalCase with `Interceptor` suffix (e.g., `ApiListTransformInterceptor`)

#### Variables & Functions
- **Variables**: camelCase (e.g., `propertyService`, `userSession`)
- **Functions**: camelCase (e.g., `createProperty`, `queryProperties`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `REQUIRE_ACTIVE_ORGANIZATION_KEY`)

#### Packages
- **Package Names**: `@hive/[package-name]` (e.g., `@hive/property`, `@hive/common`)

### Code Organization

#### Module Pattern
```typescript
@Module({
  imports: [
    // Other modules
    ConfigifyModule.forRootAsync(),
    ScheduleModule.forRoot(),
    // Feature modules
  ],
  controllers: [FeatureController],
  providers: [
    FeatureService,
    // Global providers
    GlobalZodValidationPipe,
    GlobalZodExceptionFilter,
  ],
  exports: [FeatureService], // If module exports services
})
export class FeatureModule {}
```

#### Controller Pattern
```typescript
@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get('/')
  @OptionalAuth() // or @RequireOrganizationPermission({ resource: ['read'] })
  @UseInterceptors(ApiListTransformInterceptor)
  @ApiOperation({ summary: 'Query Resources' })
  @ApiOkResponse({ type: QueryResourceResponseDto })
  @ApiErrorsResponse()
  queryResources(
    @Query() query: QueryResourceDto,
    @Session() userSession?: UserSession,
  ) {
    // Implementation
  }

  @Post('/')
  @RequireOrganizationPermission({ resource: ['create'] })
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Create Resource' })
  @ApiCreatedResponse({ type: GetResourceResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  createResource(
    @Body() createResourceDto: CreateResourceDto,
    @Query() query: CustomRepresentationQueryDto,
    @Session() { session, user }: UserSession,
  ) {
    // Implementation
  }

  @Get('/:id')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Get Resource' })
  @ApiOkResponse({ type: GetResourceResponseDto })
  @ApiErrorsResponse()
  getResource(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    // Implementation
  }

  @Patch('/:id')
  @RequireOrganizationPermission({ resource: ['update'] })
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Update Resource' })
  @ApiOkResponse({ type: GetResourceResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  updateResource(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateResourceDto: UpdateResourceDto,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    // Implementation
  }

  @Delete('/:id')
  @RequireOrganizationPermission({ resource: ['delete'] })
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Delete Resource' })
  @ApiOkResponse({ type: GetResourceResponseDto })
  @ApiErrorsResponse()
  deleteResource(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DeleteQueryDto,
  ) {
    // Implementation
  }
}
```

### DTO Patterns

#### Query DTOs
- Use `QueryBuilderSchema` from `@hive/common`
- Extend with domain-specific query parameters
- Use Zod for validation and transformation

```typescript
export const QueryResourceSchema = z.object({
  ...QueryBuilderSchema.shape,
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  // Domain-specific fields
});

export class QueryResourceDto extends createZodDto(QueryResourceSchema) {}
```

#### Create/Update DTOs
- Use Zod schemas with `createZodDto` from `nestjs-zod`
- Separate schemas for create and update operations
- Update DTOs typically omit required fields and make everything partial

```typescript
export const ResourceSchema = z.object({
  name: z.string().nonempty('Required'),
  description: z.string().optional(),
  // Other fields
});

export class CreateResourceDto extends createZodDto(ResourceSchema) {}

export class UpdateResourceDto extends createZodDto(
  ResourceSchema.partial(),
) {}
```

#### Response DTOs
- Use `@ApiProperty` decorators for Swagger documentation
- Implement interfaces for type safety
- Include metadata fields (id, timestamps, etc.)

```typescript
export class GetResourceResponseDto implements Resource {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
```

### Error Handling

#### Exception Filters
- Use `GlobalZodExceptionFilter` for Zod validation errors
- Use `GlobalRpcExceptionFilter` for gRPC errors
- Custom exceptions in `@hive/common/exceptions`

#### Error Response DTOs
- Standardized error responses via `@ApiErrorsResponse()` decorator
- Defined in `@hive/common/dto/errors.dto.ts`

### Interceptors

#### Response Transform Interceptors
- `ApiListTransformInterceptor`: Transforms list responses to `{ results: [], ...metadata }`
- `ApiDetailTransformInterceptor`: Extracts `data` field from responses

```typescript
// Used in controllers
@UseInterceptors(ApiListTransformInterceptor)
@UseInterceptors(ApiDetailTransformInterceptor)
```

---

## Service Communication

### gRPC Communication

#### Protocol Buffer Definitions
- Proto files in `packages/[domain]/src/proto/`
- Naming convention:
  - `[domain].service.proto`: Service definitions
  - `[domain].message.proto`: Request/Response messages
  - `[domain].model.proto`: Data models
  - `common.message.proto`: Shared messages

#### Proto File Structure
```protobuf
syntax = 'proto3';

import "common.message.proto";
import "[domain].model.proto";

message QueryResourceRequest {
    QueryBuilder query_builder = 1;
    optional string filter = 2;
    optional RequestContext context = 3;
}

message QueryResourceResponse {
    repeated Resource data = 1;
    string metadata = 2; // JSON string with pagination info
}

service ResourceService {
  rpc QueryResources (QueryResourceRequest) returns (QueryResourceResponse);
  rpc GetResource (GetResourceRequest) returns (GetResourceResponse);
  rpc CreateResource (CreateResourceRequest) returns (GetResourceResponse);
  rpc UpdateResource (UpdateResourceRequest) returns (GetResourceResponse);
  rpc DeleteResource (DeleteResourceRequest) returns (GetResourceResponse);
}
```

#### Type Generation
- Run `pnpm gen` in package directory to generate TypeScript types
- Uses `ts-proto` with `nestJs=true` option
- Generated types in `src/types/` directory

#### gRPC Client Usage
```typescript
// In API Gateway controller
import { HivePropertyServiceClient } from '@hive/property';

@Controller('properties')
export class PropertiesController {
  constructor(private propertiesService: HivePropertyServiceClient) {}

  @Get('/')
  queryProperties(@Query() query: QueryPropertyDto) {
    return this.propertiesService.properties.queryProperties({
      queryBuilder: {
        limit: query.limit,
        page: query.page,
        orderBy: query.orderBy,
        v: query.v,
      },
      // Other parameters
    });
  }
}
```

#### gRPC Server Setup
```typescript
// In service main.ts
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { PROPERTY_PACKAGE } from '@hive/property';

app.connectMicroservice<MicroserviceOptions>({
  transport: Transport.GRPC,
  options: {
    package: PROPERTY_PACKAGE.V1.NAME,
    protoPath: PROPERTY_PACKAGE.V1.PROTO_PATH,
    url: `${grpcConfig.host}:${grpcConfig.port}`,
  },
});
```

### Service Registry

#### Registry Service
- Central service for service discovery
- Tracks service health and endpoints
- Supports heartbeat mechanism for service health monitoring

#### Service Registration
```typescript
// In service app.module.ts
import { HiveServiceModule } from '@hive/registry';

HiveServiceModule.forRoot({
  enableHeartbeat: true,
  services: [],
  client: {
    useFactory: (config: RegistryClientConfig, http: ServerConfig, grpc: ServerConfig) => {
      return {
        service: {
          metadata: config.metadata ?? {},
          name: config.serviceName,
          version: config.serviceVersion,
          tags: ['http', 'grpc'].filter(Boolean),
          endpoints: [
            {
              host: http.host,
              port: http.port,
              protocol: 'http',
              metadata: {},
            },
            {
              host: grpc.host,
              port: grpc.port,
              protocol: 'grpc',
              metadata: {},
            },
          ],
        },
      };
    },
    inject: [RegistryClientConfig, HTTP_SERVER_CONFIG_TOKEN, GRPC_SERVER_CONFIG_TOKEN],
    providers: [HTTPServerConfigProvider, GRPCServerConfigProvider],
  },
})
```

#### Registry Client
- Services use registry client to discover other services
- Dynamic service resolution based on service name and tags

---

## Data Layer

### Prisma ORM

#### Schema Location
- Each service has its own Prisma schema in `apps/[service]/prisma/schema.prisma`
- Shared schemas might exist in packages

#### Schema Configuration
```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma" // Generated folder for imports
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

#### Model Conventions
- Use `@@map` for table name mapping (e.g., `@@map("user")`)
- Use `@db.Uuid` for UUID fields
- Use `@db.Date` for date-only fields
- Include `voided` boolean field for soft deletes
- Include `createdAt` and `updatedAt` timestamps

#### Prisma Service Pattern
```typescript
// prisma/prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

#### Prisma Module Pattern
```typescript
// prisma/prisma.module.ts
import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

### Database Migrations
- Migrations in `prisma/migrations/` directory
- Run migrations with `prisma migrate dev`
- Use descriptive migration names

---

## API Design Patterns

### REST API Conventions

#### Endpoint Naming
- **Plural nouns**: `/properties`, `/users`, `/files`
- **Nested resources**: `/properties/:id/amenities`, `/properties/:id/media`
- **Actions**: Use HTTP verbs (GET, POST, PATCH, DELETE)

#### HTTP Methods
- **GET**: Retrieve resources (list or detail)
- **POST**: Create new resources
- **PATCH**: Update existing resources (partial updates)
- **DELETE**: Delete resources (soft delete by default)

#### Query Parameters
- **Pagination**: `page`, `limit`
- **Sorting**: `orderBy` (e.g., `orderBy=name:asc,createdAt:desc`)
- **Filtering**: Domain-specific filters (e.g., `status`, `search`)
- **Representation**: `v` parameter for custom field selection

#### Response Format

**List Responses:**
```json
{
  "results": [...],
  "totalCount": 100,
  "currentPage": 1,
  "pageSize": 20,
  "totalPages": 5
}
```

**Detail Responses:**
```json
{
  "id": "...",
  "name": "...",
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Query Builder Pattern

#### Query Builder Schema
- Standardized query parameters via `QueryBuilderSchema` from `@hive/common`
- Includes: `page`, `limit`, `orderBy`, `v` (representation)

#### Custom Representation
- `v` parameter allows custom field selection
- Format: `v=field1,field2,field3` or `v=field1:subfield1,field2`

#### Pagination
- Default page size: typically 20
- Page-based pagination
- Metadata includes: `totalCount`, `currentPage`, `pageSize`, `totalPages`

### Swagger/OpenAPI Documentation

#### Swagger Setup
- Swagger UI at `/api` endpoint
- Scalar API Reference at `/api-doc` endpoint
- Merged with Better Auth OpenAPI schema

#### API Documentation Decorators
- `@ApiOperation({ summary: 'Description' })`: Operation description
- `@ApiOkResponse({ type: ResponseDto })`: Success response
- `@ApiCreatedResponse({ type: ResponseDto })`: Created response
- `@ApiErrorsResponse({ badRequest: true })`: Error responses

---

## Authentication & Authorization

### Authentication (Better Auth)

#### Setup
- Better Auth configured in `apps/api-gateway-service/src/auth/`
- CLI config: `auth.cli.config.ts`
- Authentication endpoints: `/api/auth/*`

#### Session Management
- Sessions stored in database
- Session includes: `activeOrganizationId`, `activeTeamId`
- Session accessible via `@Session()` decorator

#### Auth Decorators
- `@OptionalAuth()`: Optional authentication
- `@Session()`: Inject user session

```typescript
@Get('/')
@OptionalAuth()
queryResources(
  @Query() query: QueryResourceDto,
  @Session() userSession?: UserSession,
) {
  // userSession contains { session, user }
}
```

### Authorization (OpenFGA)

#### Authorization Package
- `@hive/authorization` package for OpenFGA integration
- ACL definitions in `packages/authorization/auth.openfga`

#### Permission Guards
- `RequireActiveOrganizationGuard`: Ensures active organization in session
- `RequireOrganizationPermissionsGuard`: Checks organization-level permissions
- `RequireSystemPermissionsGuard`: Checks system-level permissions

#### Permission Decorators
```typescript
@RequireOrganizationPermission({ property: ['create'] })
@RequireOrganizationPermission({ property: ['read', 'update'] })
@RequireSystemPermission({ admin: ['manage'] })
```

#### Permission Format
- **Resource**: Permission format (e.g., `{ property: ['create', 'read', 'update', 'delete'] }`)
- **System**: System-level permissions (e.g., `{ admin: ['manage'] }`)

### Context Propagation

#### Request Context
- `RequestContext` passed in gRPC requests
- Contains: `organizationId`, `userId`
- Automatically extracted from session in API Gateway

```typescript
context: {
  organizationId: session.activeOrganizationId,
  userId: user.id,
}
```

---

## Package Development

### Creating a New Package

#### Package Structure
1. Create package directory: `packages/[package-name]/`
2. Set up `package.json` with workspace dependencies
3. Create `src/` directory with `index.ts`
4. Set up `tsconfig.json` extending `@hive/typescript-config/base.json`
5. Add package exports in `package.json`

#### Package.json Pattern
```json
{
  "name": "@hive/[package-name]",
  "version": "0.0.1",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist/**/*"],
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
    "clean": "rm -rf dist"
  },
  "peerDependencies": {
    "@nestjs/common": "^11.0.1",
    // Other peer dependencies
  }
}
```

### gRPC Package Pattern

#### Proto Files
- Place proto files in `src/proto/`
- Generate TypeScript types with `pnpm gen`
- Types generated to `src/types/`

#### Type Generation Script
```javascript
// scripts/generate-types.js
const command = [
  'pnpm exec protoc',
  '--plugin=protoc-gen-ts_proto=./node_modules/.bin/protoc-gen-ts_proto',
  `--ts_proto_out=${outputDir}`,
  '--ts_proto_opt=nestJs=true',
  `--proto_path=${protoDir}`,
  protoFile,
].join(' ');
```

#### Package Exports
```typescript
// src/index.ts
export * from './providers';
export * from './constants';
export * from './dto';
export * from './types';
export * from './client';
```

#### Package Constants
```typescript
// src/constants/index.ts
export const PACKAGE_NAME = 'hive.[package].v1';
export const PACKAGE = {
  V1: {
    NAME: PACKAGE_NAME,
    PROTO_PATH: join(__dirname, '../proto/[package].service.proto'),
  },
};
```

---

## Development Workflow

### Setup

#### Prerequisites
- Node.js >= 18
- pnpm 8.15.5
- PostgreSQL database

#### Initial Setup
```bash
# Install dependencies
pnpm install

# Generate Prisma clients
pnpm --filter @hive/* prisma generate

# Generate proto types
pnpm --filter @hive/* gen

# Run database migrations
pnpm --filter [service-name] prisma migrate dev
```

### Development Commands

#### Root Level Commands
- `pnpm dev`: Run all services in development mode (concurrency: 20)
- `pnpm build`: Build all packages and apps
- `pnpm test`: Run all tests
- `pnpm test:e2e`: Run all E2E tests
- `pnpm lint`: Lint all packages and apps
- `pnpm format`: Format all code with Prettier

#### Service-Specific Commands
```bash
# Run specific service
pnpm --filter @hive/api-gateway-service dev

# Build specific package
pnpm --filter @hive/property build

# Generate proto types for package
pnpm --filter @hive/property gen

# Run Prisma migrations
pnpm --filter @hive/api-gateway-service prisma migrate dev
```

### Turborepo Tasks

#### Task Configuration
- Defined in `turbo.json`
- Tasks: `dev`, `build`, `lint`, `test`, `test:e2e`
- Build tasks depend on `^build` (build dependencies first)
- Dev tasks are persistent and not cached

#### Task Dependencies
- Build tasks automatically build dependencies first
- Use `^build` in `dependsOn` for build dependencies

### Code Generation

#### Proto Type Generation
```bash
# In package directory
pnpm gen
```

#### Prisma Client Generation
```bash
# In service directory
pnpm prisma generate
```

#### Better Auth Generation
```bash
# In api-gateway-service
pnpm auth:gen
```

---

## Testing Patterns

### Unit Tests

#### Test File Naming
- `*.spec.ts` for unit tests
- Same directory as source file

#### Test Structure
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ServiceName } from './service-name.service';

describe('ServiceName', () => {
  let service: ServiceName;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServiceName],
    }).compile();

    service = module.get<ServiceName>(ServiceName);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

### E2E Tests

#### E2E Test Location
- `test/app.e2e-spec.ts` in each service

#### E2E Test Configuration
- `test/jest-e2e.json` for Jest configuration
- Uses `supertest` for HTTP testing

#### E2E Test Pattern
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
```

### Frontend Tests

#### Jest Tests
- Unit tests with Jest
- React Testing Library for component tests

#### Playwright Tests
- E2E tests with Playwright
- Configuration in `playwright.config.ts`

---

## Configuration Management

### Configify

#### Configuration Setup
- Uses `@itgorillaz/configify` for configuration management
- Configuration files: `.env`, `package.json`
- Async configuration: `ConfigifyModule.forRootAsync()`

#### Configuration Pattern
```typescript
// config/app.config.ts
import { ConfigifyModule } from '@itgorillaz/configify';

export class AppConfig {
  port: number;
  environment: string;
}

ConfigifyModule.forRootAsync({
  configFilePath: ['.env', 'package.json'],
})
```

### Environment Variables

#### Naming Convention
- UPPER_SNAKE_CASE
- Service-specific prefixes (e.g., `PROPERTY_`, `IDENTITY_`)

#### Common Variables
- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: Service port
- `GRPC_HOST`: gRPC server host
- `GRPC_PORT`: gRPC server port
- `HTTP_HOST`: HTTP server host
- `HTTP_PORT`: HTTP server port

### Server Configuration

#### Server Config Pattern
```typescript
// In package config
export interface ServerConfig {
  host: string;
  port: number;
}

export const SERVER_CONFIG_TOKEN = Symbol('SERVER_CONFIG');
```

---

## Build & Deployment

### Build Process

#### Build Order
1. Shared packages build first
2. Services build after dependencies
3. Frontend builds last

#### Build Output
- Packages: `dist/` directory
- Services: `dist/` directory
- Frontend: `.next/` directory

### Turborepo Caching

#### Cache Configuration
- Build outputs cached
- Cache includes: `.next/**`, `dist/**`
- Remote caching via Vercel (optional)

### Production Build

#### Build Commands
```bash
# Build all
pnpm build

# Build specific service
pnpm --filter @hive/api-gateway-service build
```

#### Production Start
```bash
# Start production server
pnpm --filter @hive/api-gateway-service start:prod
```

---

## Rules & Guidelines

### General Rules

1. **TypeScript Strict Mode**: Always use strict TypeScript configuration
2. **No `any` Types**: Avoid `any`, use proper types or `unknown`
3. **Error Handling**: Always handle errors properly, use custom exceptions
4. **Async/Await**: Prefer async/await over Promises
5. **Imports**: Use absolute imports from workspace packages
6. **Exports**: Always export from `index.ts` in packages

### Code Style

1. **Formatting**: Use Prettier (run `pnpm format`)
2. **Linting**: Fix linting errors before committing
3. **Imports**: Group imports (external, workspace, relative)
4. **Comments**: Use JSDoc for public APIs
5. **Naming**: Follow naming conventions strictly

### API Design Rules

1. **Consistent Endpoints**: Follow REST conventions
2. **Response Format**: Always use standardized response format
3. **Error Responses**: Use standardized error responses
4. **Documentation**: Document all endpoints with Swagger decorators
5. **Validation**: Validate all inputs with Zod schemas

### Service Communication Rules

1. **gRPC First**: Use gRPC for service-to-service communication
2. **Proto Definitions**: Define all messages in proto files
3. **Type Generation**: Always regenerate types after proto changes
4. **Service Registry**: Register all services with registry
5. **Context Propagation**: Always pass RequestContext in gRPC calls

### Database Rules

1. **Migrations**: Always use migrations for schema changes
2. **Soft Deletes**: Use `voided` field for soft deletes
3. **Timestamps**: Always include `createdAt` and `updatedAt`
4. **Relations**: Define proper foreign key relationships
5. **Indexes**: Add indexes for frequently queried fields

### Security Rules

1. **Authentication**: Protect endpoints with authentication guards
2. **Authorization**: Use permission guards for resource access
3. **Input Validation**: Validate all inputs
4. **SQL Injection**: Use Prisma to prevent SQL injection
5. **Secrets**: Never commit secrets, use environment variables

### Testing Rules

1. **Test Coverage**: Maintain reasonable test coverage
2. **Unit Tests**: Write unit tests for services and utilities
3. **E2E Tests**: Write E2E tests for critical flows
4. **Test Data**: Use test fixtures, not production data
5. **Test Isolation**: Tests should be independent and isolated

### Git Rules

1. **Branch Naming**: Use descriptive branch names
2. **Commit Messages**: Use clear, descriptive commit messages
3. **PR Reviews**: Require PR reviews before merging
4. **Main Branch**: Keep main branch stable
5. **Migration Files**: Commit migration files with schema changes

### Package Rules

1. **Package Exports**: Define all exports in `package.json`
2. **Peer Dependencies**: Use peer dependencies for NestJS packages
3. **Version Management**: Use workspace protocol (`workspace:*`)
4. **Type Definitions**: Include type definitions in packages
5. **Build Scripts**: Include build and clean scripts

### Documentation Rules

1. **README**: Each service/package should have a README
2. **API Docs**: Document all public APIs
3. **Code Comments**: Comment complex logic
4. **JSDoc**: Use JSDoc for public functions and classes
5. **Examples**: Include usage examples in package READMEs

---

## Additional Resources

### Key Packages Reference

- **@hive/common**: Common utilities, DTOs, interceptors, query builder
- **@hive/registry**: Service registry and discovery
- **@hive/authorization**: OpenFGA authorization utilities
- **@hive/utils**: General utility functions
- **@hive/property**: Property domain package
- **@hive/identity**: Identity domain package
- **@hive/files**: Files domain package
- **@hive/reference**: Reference data package
- **@hive/vitual-tour**: Virtual tour package

### Common Patterns Reference

1. **Query Pattern**: Use `QueryBuilderSchema` for all queries
2. **Response Pattern**: Use interceptors for response transformation
3. **Error Pattern**: Use global exception filters
4. **Auth Pattern**: Use guards and decorators for protection
5. **gRPC Pattern**: Use proto files and generated types

---

## Version History

- **v1.0.0**: Initial project specification document

---

**Last Updated**: 2025-01-27
**Maintained By**: The Hive Team

