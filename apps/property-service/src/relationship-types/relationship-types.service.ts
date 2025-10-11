import {
  CustomRepresentationService,
  FunctionFirstArgument,
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
import { RelationshipType } from 'generated/prisma';
import { pick } from 'lodash';
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
    const dbQuery: FunctionFirstArgument<
      typeof this.prismaService.relationshipType.findMany
    > = {
      where: {
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
      },
      ...this.paginationService.buildPaginationQuery(query.queryBuilder),
      ...this.representationService.buildCustomRepresentationQuery(
        query.queryBuilder?.v,
      ),
      ...this.sortService.buildSortQuery(query.queryBuilder?.orderBy),
    };
    const [data, totalCount] = await Promise.all([
      this.prismaService.relationshipType.findMany(dbQuery),
      this.prismaService.relationshipType.count(pick(dbQuery, 'where')),
    ]);
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
