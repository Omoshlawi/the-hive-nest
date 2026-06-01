/* eslint-disable @typescript-eslint/no-unused-vars */
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
} from '@hive/common';
import {
  CreateFileUsageScopeRequest,
  DeleteRequest,
  FileUsageAuthzService,
  GetRequest,
  QueryFileUsageScopeRequest,
  UpdateFileUsageScopeRequest,
} from '@hive/files';
import { FileUsageScope, Prisma } from '../../generated/prisma/client';
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
    const dbQuery: Prisma.FileUsageScopeWhereInput = {
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
    };
    const totalCount = await this.prismaService.fileUsageScope.count({ where: dbQuery });
    const data = await this.prismaService.fileUsageScope.findMany({
      where: dbQuery,
      ...this.paginationService.buildSafePaginationQuery(query.queryBuilder, totalCount),
      ...this.representationService.buildCustomRepresentationQuery(query.queryBuilder?.v),
      ...this.sortService.buildSortQuery(query.queryBuilder?.orderBy),
    });
    return {
      data,
      metadata: JSON.stringify({ totalCount }),
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
      metadata: JSON.stringify({}),
    };
  }

  async create(query: CreateFileUsageScopeRequest) {
    const { queryBuilder, context:_, ...props } = query;

    const data = await this.prismaService.fileUsageScope.create({
      data: props,
      ...this.representationService.buildCustomRepresentationQuery(
        queryBuilder?.v,
      ),
    });

    return {
      data,
      metadata: JSON.stringify({}),
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
      metadata: JSON.stringify({}),
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
      metadata: JSON.stringify({}),
    };
  }
}
