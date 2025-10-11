import {
  CustomRepresentationService,
  FunctionFirstArgument,
  PaginationService,
  SortService,
} from '@hive/common';
import {
  CreateAmenityRequest,
  DeleteAmenityRequest,
  GetAmenityRequest,
  QueryAmenityRequest,
  UpdateAmenityRequest,
} from '@hive/property';
import { Injectable } from '@nestjs/common';
import { Amenity, Prisma } from '../../generated/prisma';
import { pick } from 'lodash';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AmenitiesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly sortService: SortService,
    private readonly paginationService: PaginationService,
    private readonly representationService: CustomRepresentationService,
  ) {}

  async getAll(query: QueryAmenityRequest) {
    const dbQuery: FunctionFirstArgument<
      typeof this.prismaService.amenity.findMany
    > = {
      where: {
        AND: [
          { voided: query?.includeVoided ? undefined : false },
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
      this.prismaService.amenity.findMany(dbQuery),
      this.prismaService.amenity.count(pick(dbQuery, 'where')),
    ]);
    return {
      data,
      metadata: JSON.stringify({ totalCount: totalCount }),
    };
  }

  async getById(query: GetAmenityRequest) {
    const data = await this.prismaService.amenity.findUnique({
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

  async create(query: CreateAmenityRequest) {
    const { queryBuilder, ...props } = query;
    const data = await this.prismaService.amenity.create({
      data: props as unknown as Prisma.AmenityCreateInput,
      ...this.representationService.buildCustomRepresentationQuery(
        queryBuilder?.v,
      ),
    });

    return {
      data,
      metadata: JSON.stringify({}),
    };
  }

  async update(query: UpdateAmenityRequest) {
    const { queryBuilder, id, ...props } = query;
    const data = await this.prismaService.amenity.update({
      where: { id },
      data: props as Prisma.AmenityUpdateInput,
      ...this.representationService.buildCustomRepresentationQuery(
        queryBuilder?.v,
      ),
    });

    return {
      data,
      metadata: JSON.stringify({}),
    };
  }
  async delete(query: DeleteAmenityRequest) {
    const { id, purge, queryBuilder } = query;
    let data: Amenity;
    if (purge) {
      data = await this.prismaService.amenity.delete({
        where: { id },
        ...this.representationService.buildCustomRepresentationQuery(
          queryBuilder?.v,
        ),
      });
    } else {
      data = await this.prismaService.amenity.update({
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
