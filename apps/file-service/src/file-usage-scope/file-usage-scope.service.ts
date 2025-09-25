import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  SortService,
  PaginationService,
  CustomRepresentationService,
  FunctionFirstArgument,
} from '@hive/common';
import {
  CreateFileUsageScopeRequest,
  DeleteRequest,
  FileUsageAuthzService,
  GetRequest,
  QueryFileUsageScopeRequest,
  UpdateFileUsageScopeRequest,
} from '@hive/files';
import { pick } from 'lodash';
import { FileUsageScope } from '../../generated/prisma';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class FileUsageScopeService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly sortService: SortService,
    private readonly paginationService: PaginationService,
    private readonly representationService: CustomRepresentationService,
    private readonly authz: FileUsageAuthzService,
  ) {}

  private async requirePermisions(userId?: string) {
    if (!userId) {
      throw new RpcException(
        new BadRequestException('User ID is required in the request context.'),
      );
    }
    const canCreate = await this.authz.canCreateFileUsageScope(userId);
    if (!canCreate) {
      throw new RpcException(
        new ForbiddenException(
          'You do not have permission to create a file usage scope.',
        ),
      );
    }
  }

  async getAll(query: QueryFileUsageScopeRequest) {
    const dbQuery: FunctionFirstArgument<
      typeof this.prismaService.fileUsageScope.findMany
    > = {
      where: {
        AND: [
          {
            voided: query?.includeVoided ? undefined : false,
            modelName: query.modelName,
            purpose: query.purpose,
          },
          {
            OR: query.search
              ? [
                  { modelName: { contains: query.search } },
                  { purpose: { contains: query.search } },
                ]
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
      this.prismaService.fileUsageScope.findMany(dbQuery),
      this.prismaService.fileUsageScope.count(pick(dbQuery, 'where')),
    ]);
    return {
      data,
      metadata: { totalCount: totalCount.toString() },
    };
  }

  async getById(query: GetRequest) {
    const data = await this.prismaService.fileUsageScope.findUnique({
      where: {
        id: query.id,
      },
      ...this.representationService.buildCustomRepresentationQuery(
        query.queryBuilder?.v,
      ),
    });
    return {
      data,
      metadata: {},
    };
  }

  async create(query: CreateFileUsageScopeRequest) {
    const { queryBuilder, context, ...props } = query;
    await this.requirePermisions(context?.userId);

    const data = await this.prismaService.fileUsageScope.create({
      data: props,
      ...this.representationService.buildCustomRepresentationQuery(
        queryBuilder?.v,
      ),
    });

    return {
      data,
      metadata: {},
    };
  }

  async update(query: UpdateFileUsageScopeRequest) {
    const { queryBuilder, id, context, ...props } = query;
    await this.requirePermisions(context?.userId);

    const data = await this.prismaService.fileUsageScope.update({
      where: { id },
      data: props,
      ...this.representationService.buildCustomRepresentationQuery(
        queryBuilder?.v,
      ),
    });

    return {
      data,
      metadata: {},
    };
  }
  async delete(query: DeleteRequest) {
    const { id, purge, queryBuilder, context } = query;
    await this.requirePermisions(context?.userId);

    let data: FileUsageScope;
    if (purge) {
      data = await this.prismaService.fileUsageScope.delete({
        where: { id },
        ...this.representationService.buildCustomRepresentationQuery(
          queryBuilder?.v,
        ),
      });
    } else {
      data = await this.prismaService.fileUsageScope.update({
        where: { id },
        data: { voided: true },
        ...this.representationService.buildCustomRepresentationQuery(
          queryBuilder?.v,
        ),
      });
    }
    return {
      data,
      metadata: {},
    };
  }
}
