import {
  SortService,
  PaginationService,
  CustomRepresentationService,
} from '@hive/common';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  QueryFileUsageRuleRequest,
  GetRequest,
  CreateFileUsageRuleRequest,
  UpdateFileUsageRuleRequest,
  DeleteRequest,
} from '@hive/files';
import { FileUsageRule, Prisma } from '../../generated/prisma/client';

@Injectable()
export class FileUsageRuleService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly sortService: SortService,
    private readonly paginationService: PaginationService,
    private readonly representationService: CustomRepresentationService,
  ) {}

  async getAll(query: QueryFileUsageRuleRequest) {
    const dbQuery: Prisma.FileUsageRuleWhereInput = {
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
    };
    const totalCount = await this.prismaService.fileUsageRule.count({
      where: dbQuery,
    });
    const data = await this.prismaService.fileUsageRule.findMany({
      where: dbQuery,
      ...this.paginationService.buildSafePaginationQuery(
        query.queryBuilder,
        totalCount,
      ),
      ...this.representationService.buildCustomRepresentationQuery(
        query.queryBuilder?.v,
      ),
      ...this.sortService.buildSortQuery(query.queryBuilder?.orderBy),
    });
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
    const { queryBuilder, context: _, ...props } = query;

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
    const { queryBuilder, id, context: _, ...props } = query;

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
    const { id, purge, queryBuilder } = query;

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
