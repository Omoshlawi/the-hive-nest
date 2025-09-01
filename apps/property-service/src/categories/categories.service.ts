import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CustomRepresentationService,
  FunctionFirstArgument,
  PaginationService,
  SortService,
} from '@hive/common';
import {
  CreatCategoryDto,
  DeleteCategoryDto,
  GetCategoryDto,
  QueryCategoryDto,
  UpdateCategoryDto,
} from '@hive/property';
import { Category } from '../../generated/prisma';
import { pick } from 'lodash';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly sortService: SortService,
    private readonly paginationService: PaginationService,
    private readonly representationService: CustomRepresentationService,
  ) {}

  async getAll(query: QueryCategoryDto) {
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
      ...this.paginationService.buildPaginationQuery(query),
      ...this.representationService.buildCustomRepresentationQuery(query.v),
      ...this.sortService.buildSortQuery(query.orderBy),
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

  async getById(query: GetCategoryDto) {
    const data = await this.prismaService.category.findUnique({
      where: {
        id: query.id,
      },
      ...this.representationService.buildCustomRepresentationQuery(query.v),
    });
    return {
      data,
      metadata: {},
    };
  }

  async create(query: CreatCategoryDto) {
    const { v, ...props } = query;
    const data = await this.prismaService.category.create({
      data: props,
      ...this.representationService.buildCustomRepresentationQuery(v),
    });

    return {
      data,
      metadata: {},
    };
  }

  async update(id: string, query: UpdateCategoryDto) {
    const { v, ...props } = query;
    const data = this.prismaService.category.update({
      where: { id },
      data: props,
      ...this.representationService.buildCustomRepresentationQuery(v),
    });

    return {
      data,
      metadata: {},
    };
  }
  async delete(id: string, query: DeleteCategoryDto) {
    const { v, purge } = query;
    let data: Category;
    if (purge) {
      data = await this.prismaService.category.delete({
        where: { id },
        ...this.representationService.buildCustomRepresentationQuery(v),
      });
    } else {
      data = await this.prismaService.category.update({
        where: { id },
        data: { voided: true },
        ...this.representationService.buildCustomRepresentationQuery(v),
      });
    }
    return {
      data,
      metadata: {},
    };
  }
}
