import {
  CustomRepresentationService,
  FunctionFirstArgument,
  PaginationService,
  SortService,
} from '@hive/common';
import {
  CreateCategoryRequest,
  DeleteCategoryRequest,
  GetCategoryRequest,
  QueryCategoryRequest,
  UpdateCategoryRequest,
} from '@hive/property';
import { Injectable } from '@nestjs/common';
import { pick } from 'lodash';
import { Category } from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly sortService: SortService,
    private readonly paginationService: PaginationService,
    private readonly representationService: CustomRepresentationService,
  ) {}

  async getAll(query: QueryCategoryRequest) {
    const dbQuery: FunctionFirstArgument<
      typeof this.prismaService.category.findMany
    > = {
      where: {
        AND: [
          { voided: query?.includeVoided ? undefined : false, OR: [{}] },
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
      this.prismaService.category.findMany(dbQuery),
      this.prismaService.category.count(pick(dbQuery, 'where')),
    ]);
    return {
      data,
      metadata: { totalCount },
    };
  }

  async getById(query: GetCategoryRequest) {
    const data = await this.prismaService.category.findUnique({
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

  async create(query: CreateCategoryRequest) {
    const { queryBuilder, ...props } = query;
    const data = await this.prismaService.category.create({
      data: props as any,
      ...this.representationService.buildCustomRepresentationQuery(
        queryBuilder?.v,
      ),
    });

    return {
      data,
      metadata: {},
    };
  }

  async update(query: UpdateCategoryRequest) {
    const { queryBuilder, id, ...props } = query;
    const data = await this.prismaService.category.update({
      where: { id },
      data: props as any,
      ...this.representationService.buildCustomRepresentationQuery(
        queryBuilder?.v,
      ),
    });

    return {
      data,
      metadata: {},
    };
  }
  async delete(query: DeleteCategoryRequest) {
    const { queryBuilder, id, purge } = query;
    let data: Category;
    if (purge) {
      data = await this.prismaService.category.delete({
        where: { id },
        ...this.representationService.buildCustomRepresentationQuery(
          queryBuilder?.v,
        ),
      });
    } else {
      data = await this.prismaService.category.update({
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
