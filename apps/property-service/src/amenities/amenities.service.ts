import {
  CustomRepresentationService,
  FunctionFirstArgument,
  PaginationService,
  SortService,
} from '@hive/common';
import {
  CreatAmenityDto,
  DeleteAmenityDto,
  GetAmenityDto,
  QueryAmenityDto,
  UpdateAmenityDto,
} from '@hive/property';
import { Injectable } from '@nestjs/common';
import { Amenity } from 'generated/prisma';
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

  async getAll(query: QueryAmenityDto) {
    const dbQuery: FunctionFirstArgument<
      typeof this.prismaService.amenity.findMany
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
      this.prismaService.amenity.findMany(dbQuery),
      this.prismaService.amenity.count(pick(dbQuery, 'where')),
    ]);
    return {
      data,
      metadata: { totalCount: totalCount.toString() },
    };
  }

  async getById(query: GetAmenityDto) {
    const data = await this.prismaService.amenity.findUnique({
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

  async create(query: CreatAmenityDto) {
    const { v, ...props } = query;
    const data = await this.prismaService.amenity.create({
      data: props,
      ...this.representationService.buildCustomRepresentationQuery(v),
    });

    return {
      data,
      metadata: {},
    };
  }

  async update(id: string, query: UpdateAmenityDto) {
    const { v, ...props } = query;
    const data = this.prismaService.amenity.update({
      where: { id },
      data: props,
      ...this.representationService.buildCustomRepresentationQuery(v),
    });

    return {
      data,
      metadata: {},
    };
  }
  async delete(query: DeleteAmenityDto) {
    const { v, purge, id } = query;
    let data: Amenity;
    if (purge) {
      data = await this.prismaService.amenity.delete({
        where: { id },
        ...this.representationService.buildCustomRepresentationQuery(v),
      });
    } else {
      data = await this.prismaService.amenity.update({
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
