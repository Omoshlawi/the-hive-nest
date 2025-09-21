import {
  SortService,
  PaginationService,
  CustomRepresentationService,
  FunctionFirstArgument,
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
import { FileUsageRule } from '../../generated/prisma';
import { pick } from 'lodash';

@Injectable()
export class FileUsageRuleService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly sortService: SortService,
    private readonly paginationService: PaginationService,
    private readonly representationService: CustomRepresentationService,
  ) {}

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
      metadata: { totalCount: totalCount.toString() },
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
      metadata: {},
    };
  }

  async create(query: CreateFileUsageRuleRequest) {
    const { queryBuilder, context, ...props } = query;
    const data = await this.prismaService.fileUsageRule.create({
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

  async update(query: UpdateFileUsageRuleRequest) {
    const { queryBuilder, id, context, ...props } = query;
    const data = await this.prismaService.fileUsageRule.update({
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
      metadata: {},
    };
  }
}
