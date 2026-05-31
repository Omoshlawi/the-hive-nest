import {
  CustomRepresentationService,
  FunctionFirstArgument,
  PaginationService,
  SortService,
} from '@hive/common';
import {
  CreateRelationshipRequest,
  DeleteRelationshipRequest,
  GetRelationshipRequest,
  QueryRelationshipRequest,
  UpdateRelationshipRequest,
} from '@hive/property';
import { Injectable } from '@nestjs/common';
import { Relationship, Prisma } from '../../generated/prisma';
import { pick } from 'lodash';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PropertyRelationshipsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly sortService: SortService,
    private readonly paginationService: PaginationService,
    private readonly representationService: CustomRepresentationService,
  ) {}

  async getAll(query: QueryRelationshipRequest) {
    const dbQuery: FunctionFirstArgument<
      typeof this.prismaService.relationship.findMany
    > = {
      where: {
        AND: [
          {
            voided: query?.includeVoided ? undefined : false,
            startDate: {
              gte: query.startDateFrom
                ? new Date(query.startDateFrom)
                : undefined,
              lte: query.startDateTo ? new Date(query.startDateTo) : undefined,
            },
            endDate: {
              gte: query.endDateFrom ? new Date(query.endDateFrom) : undefined,
              lte: query.endDateTo ? new Date(query.endDateTo) : undefined,
            },
            propertyAId: query.propertyAId,
            propertyBId: query.propertyBId,
            typeId: query.typeId,
          },
          {
            OR: query.search
              ? [
                  {
                    propertyB: {
                      name: { contains: query.search, mode: 'insensitive' },
                    },
                  },
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
      this.prismaService.relationship.findMany(dbQuery),
      this.prismaService.relationship.count(pick(dbQuery, 'where')),
    ]);
    return {
      data,
      metadata: JSON.stringify({ totalCount: totalCount }),
    };
  }
  async getById(query: GetRelationshipRequest) {
    const data = await this.prismaService.relationship.findUnique({
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

  async create(query: CreateRelationshipRequest) {
    const { queryBuilder, startDate, endDate, context, ...props } = query;
    const data = await this.prismaService.relationship.create({
      data: {
        ...props,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
      },
      ...this.representationService.buildCustomRepresentationQuery(
        queryBuilder?.v,
      ),
    });

    return {
      data,
      metadata: JSON.stringify({}),
    };
  }

  async update(query: UpdateRelationshipRequest) {
    const { queryBuilder, id, startDate, endDate, context, ...props } = query;
    const updateData: Prisma.RelationshipUpdateInput = {
      ...props,
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate !== undefined && {
        endDate: endDate ? new Date(endDate) : null,
      }),
    };
    const data = await this.prismaService.relationship.update({
      where: { id },
      data: updateData,
      ...this.representationService.buildCustomRepresentationQuery(
        queryBuilder?.v,
      ),
    });

    return {
      data,
      metadata: JSON.stringify({}),
    };
  }

  async delete(query: DeleteRelationshipRequest) {
    const { queryBuilder, id, purge } = query;
    let data: Relationship;
    if (purge) {
      data = await this.prismaService.relationship.delete({
        where: { id },
        ...this.representationService.buildCustomRepresentationQuery(
          queryBuilder?.v,
        ),
      });
    } else {
      data = await this.prismaService.relationship.update({
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
