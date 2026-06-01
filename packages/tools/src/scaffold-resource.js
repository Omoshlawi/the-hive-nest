#!/usr/bin/env node
/**
 * Scaffold a new gRPC resource across domain service + API gateway.
 *
 * Usage:
 *   node scripts/scaffold-resource.js \
 *     --resource Review \
 *     --package property \
 *     --service PROPERTIES_SERVICE_NAME
 *
 * Options:
 *   --resource   PascalCase resource name (e.g. Review)
 *   --package    Package name: property | reference | <other>
 *   --service    gRPC service name constant (e.g. PROPERTIES_SERVICE_NAME)
 *   --read-only  Skip create/update methods
 *   --no-gateway Skip API gateway controller generation
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--') continue; // pnpm passes '--' as separator
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      if (!key) continue;
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        args[key] = true;
      } else {
        args[key] = next;
        i++;
      }
    }
  }
  return args;
}

function validateArgs(args) {
  const missing = ['resource', 'package', 'service'].filter((k) => !args[k]);
  if (missing.length) {
    console.error(
      `Missing required arguments: ${missing.map((k) => `--${k}`).join(', ')}`,
    );
    console.error(
      'Usage: node scripts/scaffold-resource.js --resource Review --package property --service PROPERTIES_SERVICE_NAME',
    );
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Name derivation
// ---------------------------------------------------------------------------

function toCamel(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function toKebab(str) {
  return str
    .replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`)
    .replace(/^-/, '');
}

function toProtoSnake(str) {
  return str
    .replace(/([A-Z])/g, (m) => `_${m.toLowerCase()}`)
    .replace(/^_/, '');
}

function pluralise(str) {
  if (str.endsWith('y') && !/[aeiou]y$/i.test(str)) {
    return str.slice(0, -1) + 'ies';
  }
  if (
    str.endsWith('s') ||
    str.endsWith('x') ||
    str.endsWith('z') ||
    str.endsWith('ch') ||
    str.endsWith('sh')
  ) {
    return str + 'es';
  }
  return str + 's';
}

function deriveNames(resourcePascal) {
  const plural = pluralise(resourcePascal);
  return {
    pascal: resourcePascal, // Review
    pluralPascal: plural, // Reviews
    camel: toCamel(resourcePascal), // review
    pluralCamel: toCamel(plural), // reviews
    kebab: toKebab(resourcePascal), // review
    pluralKebab: toKebab(plural), // reviews
    protoSnake: toProtoSnake(resourcePascal), // review
    pluralProtoSnake: toProtoSnake(plural), // reviews
  };
}

// ---------------------------------------------------------------------------
// File templates
// ---------------------------------------------------------------------------

function dtoTemplate(n, pkg) {
  const pkgAlias = `@hive/${pkg}`;
  return `import { QueryBuilderSchema } from '@hive/common';
import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { ${n.pascal} } from '../types';
import z from 'zod';

export const Query${n.pascal}Schema = z.object({
  ...QueryBuilderSchema.shape,
  search: z.string().optional(),
  organizationId: z.string().optional(),
  includeVoided: z
    .stringbool({ truthy: ['true', '1'], falsy: ['false', '0'] })
    .optional()
    .default(false),
});

export const ${n.pascal}Schema = z.object({
  // TODO: add fields
  name: z.string().min(1, 'Required'),
  organizationId: z.string().optional(),
});

export class Query${n.pascal}Dto extends createZodDto(Query${n.pascal}Schema) {}
export class Create${n.pascal}Dto extends createZodDto(${n.pascal}Schema) {}
export class Update${n.pascal}Dto extends createZodDto(${n.pascal}Schema.partial()) {}

export class Get${n.pascal}ResponseDto implements ${n.pascal} {
  @ApiProperty() id: string;
  @ApiProperty() voided: boolean;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
  // TODO: add model fields
}

export class Query${n.pascal}ResponseDto {
  @ApiProperty({ isArray: true, type: Get${n.pascal}ResponseDto })
  results: Get${n.pascal}ResponseDto[];
  @ApiProperty() totalCount: number;
}
`;
}

function domainServiceTemplate(n, pkg) {
  return `import {
  CustomRepresentationService,
  FunctionFirstArgument,
  PaginationService,
  SortService,
} from '@hive/common';
import {
  Create${n.pascal}Request,
  Delete${n.pascal}Request,
  Get${n.pascal}Request,
  Query${n.pascal}Request,
  Update${n.pascal}Request,
} from '@hive/${pkg}';
import { Injectable } from '@nestjs/common';
import { ${n.pascal}, Prisma } from '../../generated/prisma';
import { pick } from 'lodash';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ${n.pluralPascal}Service {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly sortService: SortService,
    private readonly paginationService: PaginationService,
    private readonly representationService: CustomRepresentationService,
  ) {}

  async getAll(query: Query${n.pascal}Request) {
    const dbQuery: FunctionFirstArgument<
      typeof this.prismaService.${n.camel}.findMany
    > = {
      where: {
        AND: [
          { voided: query?.includeVoided ? undefined : false },
          {
            OR: query.search
              ? [{ name: { contains: query.search } }]
              : undefined,
          },
        ],
      },
      ...this.paginationService.buildPaginationQuery(query.queryBuilder),
      ...this.representationService.buildCustomRepresentationQuery(
        query.queryBuilder?.v,
      ),
      ...this.sortService.buildSortQuery(query.queryBuilder?.orderBy),
    };
    const [data, totalCount] = await Promise.all([
      this.prismaService.${n.camel}.findMany(dbQuery),
      this.prismaService.${n.camel}.count(pick(dbQuery, 'where')),
    ]);
    return { data, metadata: JSON.stringify({ totalCount }) };
  }

  async getById(query: Get${n.pascal}Request) {
    const data = await this.prismaService.${n.camel}.findUnique({
      where: { id: query.id },
      ...this.representationService.buildCustomRepresentationQuery(
        query.queryBuilder?.v,
      ),
    });
    return { data, metadata: JSON.stringify({}) };
  }

  async create(query: Create${n.pascal}Request) {
    const { queryBuilder, ...props } = query;
    const data = await this.prismaService.${n.camel}.create({
      data: props as unknown as Prisma.${n.pascal}CreateInput,
      ...this.representationService.buildCustomRepresentationQuery(
        queryBuilder?.v,
      ),
    });
    return { data, metadata: JSON.stringify({}) };
  }

  async update(query: Update${n.pascal}Request) {
    const { queryBuilder, id, ...props } = query;
    const data = await this.prismaService.${n.camel}.update({
      where: { id },
      data: props as Prisma.${n.pascal}UpdateInput,
      ...this.representationService.buildCustomRepresentationQuery(
        queryBuilder?.v,
      ),
    });
    return { data, metadata: JSON.stringify({}) };
  }

  async delete(query: Delete${n.pascal}Request) {
    const { id, purge, queryBuilder } = query;
    const repQuery = this.representationService.buildCustomRepresentationQuery(
      queryBuilder?.v,
    );
    const data = purge
      ? await this.prismaService.${n.camel}.delete({ where: { id }, ...repQuery })
      : await this.prismaService.${n.camel}.update({
          where: { id },
          data: { voided: true },
          ...repQuery,
        });
    return { data, metadata: JSON.stringify({}) };
  }
}
`;
}

function domainControllerTemplate(n, pkg, serviceName) {
  return `import {
  Create${n.pascal}Request,
  Delete${n.pascal}Request,
  Get${n.pascal}Request,
  Get${n.pascal}Response,
  I${n.pluralPascal}Controller,
  Query${n.pascal}Request,
  Query${n.pascal}Response,
  Update${n.pascal}Request,
} from '@hive/${pkg}';
import { Controller, NotFoundException } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { RpcException } from '@nestjs/microservices';
import { ${n.pluralPascal}Service } from './${n.pluralKebab}.service';

@Controller('${n.pluralKebab}')
export class ${n.pluralPascal}Controller implements I${n.pluralPascal}Controller {
  constructor(private readonly ${n.pluralCamel}Service: ${n.pluralPascal}Service) {}

  @GrpcMethod(${serviceName}, 'query${n.pluralPascal}')
  query${n.pluralPascal}(request: Query${n.pascal}Request): Promise<Query${n.pascal}Response> {
    return this.${n.pluralCamel}Service.getAll(request) as unknown as Promise<Query${n.pascal}Response>;
  }

  @GrpcMethod(${serviceName}, 'get${n.pascal}')
  async get${n.pascal}(request: Get${n.pascal}Request): Promise<Get${n.pascal}Response> {
    const res = await this.${n.pluralCamel}Service.getById(request);
    if (!res.data) throw new RpcException(new NotFoundException('${n.pascal} not found'));
    return res as unknown as Get${n.pascal}Response;
  }

  @GrpcMethod(${serviceName}, 'create${n.pascal}')
  create${n.pascal}(request: Create${n.pascal}Request): Promise<Get${n.pascal}Response> {
    return this.${n.pluralCamel}Service.create(request) as unknown as Promise<Get${n.pascal}Response>;
  }

  @GrpcMethod(${serviceName}, 'update${n.pascal}')
  update${n.pascal}(request: Update${n.pascal}Request): Promise<Get${n.pascal}Response> {
    return this.${n.pluralCamel}Service.update(request) as unknown as Promise<Get${n.pascal}Response>;
  }

  @GrpcMethod(${serviceName}, 'delete${n.pascal}')
  delete${n.pascal}(request: Delete${n.pascal}Request): Promise<Get${n.pascal}Response> {
    return this.${n.pluralCamel}Service.delete(request) as unknown as Promise<Get${n.pascal}Response>;
  }
}
`;
}

function domainModuleTemplate(n) {
  return `import { Module } from '@nestjs/common';
import { ${n.pluralPascal}Controller } from './${n.pluralKebab}.controller';
import { ${n.pluralPascal}Service } from './${n.pluralKebab}.service';

@Module({
  providers: [${n.pluralPascal}Service],
  controllers: [${n.pluralPascal}Controller],
})
export class ${n.pluralPascal}Module {}
`;
}

function gatewayControllerTemplate(n, pkg) {
  const clientClass = `Hive${pkg.charAt(0).toUpperCase() + pkg.slice(1)}ServiceClient`;
  return `import { ApiErrorsResponse, CustomRepresentationQueryDto, DeleteQueryDto } from '@hive/common';
import {
  Create${n.pascal}Dto,
  Get${n.pascal}ResponseDto,
  Query${n.pascal}Dto,
  Query${n.pascal}ResponseDto,
  Update${n.pascal}Dto,
} from '@hive/${pkg}';
import { ${clientClass} } from '@hive/${pkg}';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { OptionalAuth, Session } from '@thallesp/nestjs-better-auth';
import {
  ApiDetailTransformInterceptor,
  ApiListTransformInterceptor,
} from '../app.interceptors';
import { RequireOrganizationPermission } from '../auth/auth.decorators';
import { UserSession } from '../auth/auth.types';

@Controller('${n.pluralKebab}')
@ApiTags('${n.pluralPascal}')
export class ${n.pluralPascal}Controller {
  constructor(private readonly ${pkg}Service: ${clientClass}) {}

  @Get('/')
  @OptionalAuth()
  @UseInterceptors(ApiListTransformInterceptor)
  @ApiOperation({ summary: 'Query ${n.pluralPascal}' })
  @ApiOkResponse({ type: Query${n.pascal}ResponseDto })
  @ApiErrorsResponse()
  query${n.pascal}(
    @Query() query: Query${n.pascal}Dto,
    @Session() userSession?: UserSession,
  ) {
    const { session } = userSession ?? {};
    return this.${pkg}Service.${n.pluralCamel}.query${n.pluralPascal}({
      queryBuilder: {
        limit: query.limit,
        orderBy: query.orderBy,
        page: query.page,
        v: query.v,
      },
      includeVoided: query.includeVoided,
      search: query.search,
      context: { organizationId: session?.activeOrganizationId ?? '' },
    });
  }

  @Post('/')
  @RequireOrganizationPermission({ ${n.pluralCamel}: ['create'] })
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Create ${n.pascal}' })
  @ApiCreatedResponse({ type: Get${n.pascal}ResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  create${n.pascal}(
    @Body() dto: Create${n.pascal}Dto,
    @Query() query: CustomRepresentationQueryDto,
    @Session() { session, user }: UserSession,
  ) {
    return this.${pkg}Service.${n.pluralCamel}.create${n.pascal}({
      queryBuilder: { v: query.v },
      ...dto,
      context: { organizationId: session.activeOrganizationId, userId: user.id },
    });
  }

  @Get('/:id')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Get ${n.pascal}' })
  @ApiOkResponse({ type: Get${n.pascal}ResponseDto })
  @ApiErrorsResponse()
  get${n.pascal}(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.${pkg}Service.${n.pluralCamel}.get${n.pascal}({ id, queryBuilder: query });
  }

  @Patch('/:id')
  @RequireOrganizationPermission({ ${n.pluralCamel}: ['update'] })
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Update ${n.pascal}' })
  @ApiOkResponse({ type: Get${n.pascal}ResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  update${n.pascal}(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Update${n.pascal}Dto,
    @Query() query: CustomRepresentationQueryDto,
    @Session() { session, user }: UserSession,
  ) {
    return this.${pkg}Service.${n.pluralCamel}.update${n.pascal}({
      id,
      queryBuilder: { v: query?.v },
      ...dto,
      context: { organizationId: session.activeOrganizationId, userId: user.id },
    });
  }

  @Delete('/:id')
  @RequireOrganizationPermission({ ${n.pluralCamel}: ['delete'] })
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Delete ${n.pascal}' })
  @ApiOkResponse({ type: Get${n.pascal}ResponseDto })
  @ApiErrorsResponse()
  delete${n.pascal}(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DeleteQueryDto,
    @Session() { session, user }: UserSession,
  ) {
    return this.${pkg}Service.${n.pluralCamel}.delete${n.pascal}({
      id,
      purge: query.purge,
      queryBuilder: { v: query.v },
      context: { organizationId: session.activeOrganizationId, userId: user.id },
    });
  }
}
`;
}

function gatewayModuleTemplate(n, pkg) {
  const clientClass = `Hive${pkg.charAt(0).toUpperCase() + pkg.slice(1)}ServiceClient`;
  return `import { HiveServiceModule } from '@hive/registry';
import { ${clientClass} } from '@hive/${pkg}';
import { Module } from '@nestjs/common';
import { ${n.pluralPascal}Controller } from './${n.pluralKebab}.controller';

@Module({
  imports: [HiveServiceModule.forFeature([${clientClass}])],
  controllers: [${n.pluralPascal}Controller],
})
export class ${n.pluralPascal}Module {}
`;
}

// ---------------------------------------------------------------------------
// Console instructions for manual steps
// ---------------------------------------------------------------------------

function printManualSteps(n, pkg, serviceName, rootDir) {
  const pkgPascal = pkg.charAt(0).toUpperCase() + pkg.slice(1);
  const pkgPluralPascal = pluralise(pkgPascal);
  const clientClass = `Hive${pkgPascal}ServiceClient`;

  console.log('\n' + '='.repeat(70));
  console.log('SCAFFOLD COMPLETE — manual steps remaining:');
  console.log('='.repeat(70));

  console.log(`
[1] Create proto message file:
    packages/${pkg}/src/proto/${n.protoSnake}.message.proto
    ─────────────────────────────────────────
    syntax = "proto3";
    import "common.message.proto";
    import "${pkg}.models.proto";

    message Query${n.pascal}Request {
        QueryBuilder query_builder = 1;
        optional string search = 2;
        optional string organization_id = 3;
        optional bool include_voided = 4;
        optional RequestContext context = 5;
    }
    message Query${n.pascal}Response {
        repeated ${n.pascal} data = 1;
        string metadata = 2;
    }
    message Create${n.pascal}Request {
        QueryBuilder query_builder = 1;
        string name = 2;
        optional string organization_id = 3;
        optional RequestContext context = 4;
    }
    message Update${n.pascal}Request {
        QueryBuilder query_builder = 1;
        string id = 2;
        optional string name = 3;
        optional RequestContext context = 4;
    }
    message Get${n.pascal}Request {
        QueryBuilder query_builder = 1;
        string id = 2;
        optional RequestContext context = 3;
    }
    message Get${n.pascal}Response {
        ${n.pascal} data = 1;
        string metadata = 2;
    }
    message Delete${n.pascal}Request {
        QueryBuilder query_builder = 1;
        string id = 2;
        optional bool purge = 3;
        optional RequestContext context = 4;
    }

    Also add to ${pkg}.models.proto:
        message ${n.pascal} {
            string id = 1;
            string name = 2;
            string created_at = 3;
            string updated_at = 4;
            bool voided = 5;
        }
`);

  console.log(`[2] Add RPC methods inside service ${pkgPluralPascal} in packages/${pkg}/src/proto/${pkg}.service.proto:
    // ${n.pascal}
    rpc Query${n.pluralPascal}(Query${n.pascal}Request) returns (Query${n.pascal}Response){};
    rpc Get${n.pascal}(Get${n.pascal}Request) returns (Get${n.pascal}Response){};
    rpc Create${n.pascal}(Create${n.pascal}Request) returns (Get${n.pascal}Response){};
    rpc Update${n.pascal}(Update${n.pascal}Request) returns (Get${n.pascal}Response){};
    rpc Delete${n.pascal}(Delete${n.pascal}Request) returns (Get${n.pascal}Response){};
`);

  console.log(`[3] Run type generation:
    pnpm --filter @hive/${pkg} gen
`);

  console.log(`[4] Add barrel export to packages/${pkg}/src/dto/index.ts:
    export * from './${n.pluralKebab}.dto';
`);

  console.log(`[5] After pnpm gen, add to packages/${pkg}/src/types/index.ts:
    export {
      Create${n.pascal}Request,
      Delete${n.pascal}Request,
      Get${n.pascal}Request,
      Get${n.pascal}Response,
      Query${n.pascal}Request,
      Query${n.pascal}Response,
      Update${n.pascal}Request,
    } from './${n.protoSnake}.message';

    export type I${n.pluralPascal}Controller = Pick<
      ${pkgPluralPascal}Controller,
      | 'query${n.pluralPascal}'
      | 'get${n.pascal}'
      | 'create${n.pascal}'
      | 'update${n.pascal}'
      | 'delete${n.pascal}'
    >;
`);

  console.log(`[6] Add to packages/${pkg}/src/client/hive-${pkg}-client.service.ts (new readonly property):
    readonly ${n.pluralCamel} = {
      query${n.pluralPascal}: (request: Query${n.pascal}Request): Observable<Query${n.pascal}Response> =>
        this.loadBalance().query${n.pluralPascal}(request),
      get${n.pascal}: (request: Get${n.pascal}Request): Observable<Get${n.pascal}Response> =>
        this.loadBalance().get${n.pascal}(request),
      create${n.pascal}: (request: Create${n.pascal}Request): Observable<Get${n.pascal}Response> =>
        this.loadBalance().create${n.pascal}(request),
      update${n.pascal}: (request: Update${n.pascal}Request): Observable<Get${n.pascal}Response> =>
        this.loadBalance().update${n.pascal}(request),
      delete${n.pascal}: (request: Delete${n.pascal}Request): Observable<Get${n.pascal}Response> =>
        this.loadBalance().delete${n.pascal}(request),
    };
`);

  console.log(`[7] Import ${n.pluralPascal}Module in apps/${pkg}-service/src/app.module.ts:
    import { ${n.pluralPascal}Module } from './${n.pluralKebab}/${n.pluralKebab}.module';
    // add to @Module imports array: ${n.pluralPascal}Module
`);

  console.log(`[8] Import ${n.pluralPascal}Module in apps/api-gateway-service/src/app.module.ts:
    import { ${n.pluralPascal}Module } from './${n.pluralKebab}/${n.pluralKebab}.module';
    // add to @Module imports array: ${n.pluralPascal}Module
`);

  console.log('='.repeat(70) + '\n');
}

// ---------------------------------------------------------------------------
// File writing
// ---------------------------------------------------------------------------

function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`  created  ${filePath}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = parseArgs(process.argv);
  validateArgs(args);

  const resourcePascal = args.resource;
  const pkg = args.package;
  const serviceName = args.service;
  const skipGateway = args['no-gateway'] === true;

  const n = deriveNames(resourcePascal);
  const rootDir = path.resolve(__dirname, '../../..');

  console.log(`\nScaffolding ${n.pluralPascal} for @hive/${pkg}...\n`);

  // 1. DTO file
  writeFile(
    path.join(rootDir, `packages/${pkg}/src/dto/${n.pluralKebab}.dto.ts`),
    dtoTemplate(n, pkg),
  );

  // 2. Domain service
  writeFile(
    path.join(
      rootDir,
      `apps/${pkg}-service/src/${n.pluralKebab}/${n.pluralKebab}.service.ts`,
    ),
    domainServiceTemplate(n, pkg),
  );

  // 3. Domain controller
  writeFile(
    path.join(
      rootDir,
      `apps/${pkg}-service/src/${n.pluralKebab}/${n.pluralKebab}.controller.ts`,
    ),
    domainControllerTemplate(n, pkg, serviceName),
  );

  // 4. Domain module
  writeFile(
    path.join(
      rootDir,
      `apps/${pkg}-service/src/${n.pluralKebab}/${n.pluralKebab}.module.ts`,
    ),
    domainModuleTemplate(n),
  );

  if (!skipGateway) {
    // 5. Gateway controller
    writeFile(
      path.join(
        rootDir,
        `apps/api-gateway-service/src/${n.pluralKebab}/${n.pluralKebab}.controller.ts`,
      ),
      gatewayControllerTemplate(n, pkg),
    );

    // 6. Gateway module
    writeFile(
      path.join(
        rootDir,
        `apps/api-gateway-service/src/${n.pluralKebab}/${n.pluralKebab}.module.ts`,
      ),
      gatewayModuleTemplate(n, pkg),
    );
  }

  printManualSteps(n, pkg, serviceName, rootDir);
}

if (require.main === module) {
  main();
}

module.exports = { main, deriveNames, pluralise };
