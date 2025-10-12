import {
  CustomRepresentationService,
  FunctionFirstArgument,
  PaginationService,
  SortService,
} from '@hive/common';
import {
  CreatePropertyRequest,
  DeletePropertyRequest,
  GetPropertyRequest,
  QueryPropertyRequest,
  UpdatePropertyRequest,
} from '@hive/property';
import { Injectable } from '@nestjs/common';
import { Property, Prisma } from '../../generated/prisma';
import { pick } from 'lodash';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PropertyService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly sortService: SortService,
    private readonly paginationService: PaginationService,
    private readonly representationService: CustomRepresentationService,
  ) {}

  async getAll(query: QueryPropertyRequest) {
    const dbQuery: FunctionFirstArgument<
      typeof this.prismaService.property.findMany
    > = {
      where: {
        AND: [
          {
            voided: query?.includeVoided ? undefined : false,
            status: query?.status as Prisma.EnumPropertyStatusFilter,
            // organizationId: ,
          },
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
      this.prismaService.property.findMany(dbQuery),
      this.prismaService.property.count(pick(dbQuery, 'where')),
    ]);
    return {
      data,
      metadata: JSON.stringify({ totalCount: totalCount }),
    };
  }

  async getById(query: GetPropertyRequest) {
    const data = await this.prismaService.property.findUnique({
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

  async create(query: CreatePropertyRequest) {
    const { queryBuilder, ...props } = query;
    const data = await this.prismaService.property.create({
      data: props as unknown as Prisma.PropertyCreateInput,
      ...this.representationService.buildCustomRepresentationQuery(
        queryBuilder?.v,
      ),
    });

    return {
      data,
      metadata: JSON.stringify({}),
    };
  }

  async update(query: UpdatePropertyRequest) {
    const { queryBuilder, id, ...props } = query;
    const data = await this.prismaService.property.update({
      where: { id },
      data: props as Prisma.PropertyUpdateInput,
      ...this.representationService.buildCustomRepresentationQuery(
        queryBuilder?.v,
      ),
    });

    return {
      data,
      metadata: JSON.stringify({}),
    };
  }

  async delete(query: DeletePropertyRequest) {
    const { id, purge, queryBuilder } = query;
    let data: Property;
    if (purge) {
      data = await this.prismaService.property.delete({
        where: { id },
        ...this.representationService.buildCustomRepresentationQuery(
          queryBuilder?.v,
        ),
      });
    } else {
      data = await this.prismaService.property.update({
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
