import {
  CustomRepresentationService,
  PaginationService,
  SortService,
} from '@hive/common';
import { DeleteRequest, QueryAddressHierarchyRequest } from '@hive/reference';
import { Injectable } from '@nestjs/common';
import { AddressHierarchy as AddressHierarchyModel, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AddressHierarchyService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly sortService: SortService,
    private readonly paginationService: PaginationService,
    private readonly representationService: CustomRepresentationService,
  ) {}

  async getAll(query: QueryAddressHierarchyRequest) {
    const dbQuery: Prisma.AddressHierarchyWhereInput = {
      AND: [
        {
          voided: query?.includeVoided ? undefined : false,
          country: query?.country,
          level: query?.level,
          code: query?.code,
          name: query?.name,
          nameLocal: query?.nameLocal,
          parentId: query?.parentId,
          parent: {
            code: query?.parentCode,
            country: query?.parentCountry,
            level: query?.parentLevel,
            name: query?.parentName,
            nameLocal: query?.parentNameLocal,
          },
        },
        {
          OR: query.search
            ? [{ name: { contains: query.search, mode: 'insensitive' } }]
            : undefined,
        },
      ],
    };
    const totalCount = await this.prismaService.addressHierarchy.count({ where: dbQuery });
    const data = await this.prismaService.addressHierarchy.findMany({
      where: dbQuery,
      ...this.paginationService.buildSafePaginationQuery(query.queryBuilder, totalCount),
      ...this.representationService.buildCustomRepresentationQuery(query.queryBuilder?.v),
      ...this.sortService.buildSortQuery(query.queryBuilder?.orderBy),
    });
    return {
      data,
      metadata: JSON.stringify({ totalCount: totalCount }),
    };
  }

  async delete(query: DeleteRequest) {
    const { id, purge, queryBuilder } = query;
    let data: AddressHierarchyModel;
    if (purge) {
      data = await this.prismaService.addressHierarchy.delete({
        where: { id },
        ...this.representationService.buildCustomRepresentationQuery(
          queryBuilder?.v,
        ),
      });
    } else {
      data = await this.prismaService.addressHierarchy.update({
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
