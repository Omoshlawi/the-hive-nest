import {
  CustomRepresentationService,
  PaginationService,
  SortService,
} from '@hive/common';
import {
  CreateRelationshipTypeRequest,
  DeleteRelationshipTypeRequest,
  GetRelationshipTypeRequest,
  QueryRelationshipTypeRequest,
  UpdateRelationshipTypeRequest,
} from '@hive/property';
import { Injectable } from '@nestjs/common';
import { Prisma, RelationshipType } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class RelationshipTypesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly sortService: SortService,
    private readonly paginationService: PaginationService,
    private readonly representationService: CustomRepresentationService,
  ) {}

  async getAll(query: QueryRelationshipTypeRequest) {
    const dbQuery: Prisma.RelationshipTypeWhereInput = {
      AND: [
        { voided: query?.includeVoided ? undefined : false },
        {
          OR: query.search
            ? [
                { aIsToB: { contains: query.search } },
                { bIsToA: { contains: query.search } },
              ]
            : undefined,
        },
      ],
    };
    const totalCount = await this.prismaService.relationshipType.count({ where: dbQuery });
    const data = await this.prismaService.relationshipType.findMany({
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

  async getById(query: GetRelationshipTypeRequest) {
    const data = await this.prismaService.relationshipType.findUnique({
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

  async create(query: CreateRelationshipTypeRequest) {
    const { queryBuilder, ...props } = query;
    const data = await this.prismaService.relationshipType.create({
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

  async update(query: UpdateRelationshipTypeRequest) {
    const { queryBuilder, id, ...props } = query;
    const data = await this.prismaService.relationshipType.update({
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
  async delete(query: DeleteRelationshipTypeRequest) {
    const { id, purge, queryBuilder } = query;
    let data: RelationshipType;
    if (purge) {
      data = await this.prismaService.relationshipType.delete({
        where: { id },
        ...this.representationService.buildCustomRepresentationQuery(
          queryBuilder?.v,
        ),
      });
    } else {
      data = await this.prismaService.relationshipType.update({
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
