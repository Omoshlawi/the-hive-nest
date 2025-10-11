/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  SortService,
  PaginationService,
  CustomRepresentationService,
  FunctionFirstArgument,
} from '@hive/common';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  QueryFileUsageRuleRequest,
  GetRequest,
  CreateFileUsageRuleRequest,
  UpdateFileUsageRuleRequest,
  DeleteRequest,
  FileUsageAuthzService,
} from '@hive/files';
import { FileUsageRule } from '../../generated/prisma';
import { pick } from 'lodash';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class FileUsageRuleService {
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
    const canCreate = await this.authz.canCreateFileUsageRule(userId);
    if (!canCreate) {
      throw new RpcException(
        new ForbiddenException(
          'You do not have permission to create a file usage scope.',
        ),
      );
    }
  }

  async getAll(query: QueryFileUsageRuleRequest) {
    const dbQuery: FunctionFirstArgument<
      typeof this.prismaService.fileUsageRule.findMany
    > = {
      where: {
        AND: [
          {
            voided: query?.includeVoided ? undefined : false,
            scopeId: query?.scopeId,
            scope: { modelName: query.modelName, purpose: query.purpose },
          },
          {
            OR: query.search
              ? [
                  { scope: { modelName: { contains: query.search } } },
                  { scope: { purpose: { contains: query.search } } },
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
      this.prismaService.fileUsageRule.findMany(dbQuery),
      this.prismaService.fileUsageRule.count(pick(dbQuery, 'where')),
    ]);
    return {
      data,
      metadata: JSON.stringify({ totalCount: totalCount }),
    };
  }

  async getById(query: GetRequest) {
    const data = await this.prismaService.fileUsageRule.findUnique({
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

  async create(query: CreateFileUsageRuleRequest) {
    const { queryBuilder, context:_, ...props } = query;

    const data = await this.prismaService.fileUsageRule.create({
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

  async update(query: UpdateFileUsageRuleRequest) {
    const { queryBuilder, id, context, ...props } = query;
    await this.requirePermisions(context?.userId);

    const data = await this.prismaService.fileUsageRule.update({
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

    let data: FileUsageRule;
    if (purge) {
      data = await this.prismaService.fileUsageRule.delete({
        where: { id },
        ...this.representationService.buildCustomRepresentationQuery(
          queryBuilder?.v,
        ),
      });
    } else {
      data = await this.prismaService.fileUsageRule.update({
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
