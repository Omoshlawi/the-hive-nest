import {
  CustomRepresentationService,
  PaginationService,
  SortService,
} from '@hive/common';
import {
  CreatePropertyMediaRequest,
  DeletePropertyMediaRequest,
  GetPropertyMediaRequest,
  QueryPropertyMediaRequest,
  UpdatePropertyMediaRequest,
} from '@hive/property';
import { Injectable } from '@nestjs/common';
import { Prisma, PropertyMedia, PropertyMediaType } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PropertyMediaService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly sortService: SortService,
    private readonly paginationService: PaginationService,
    private readonly representationService: CustomRepresentationService,
  ) {}

  async getAll(query: QueryPropertyMediaRequest) {
    const dbQuery: Prisma.PropertyMediaWhereInput = {
      AND: [
        {
          voided: query?.includeVoided ? undefined : false,
          type: query.type as PropertyMediaType,
          propertyId: query.propertyId,
        },
        {
          OR: query.search
            ? [{ title: { contains: query.search, mode: 'insensitive' } }]
            : undefined,
        },
      ],
    };
    const totalCount = await this.prismaService.propertyMedia.count({ where: dbQuery });
    const data = await this.prismaService.propertyMedia.findMany({
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

  async getById(query: GetPropertyMediaRequest) {
    const data = await this.prismaService.propertyMedia.findUnique({
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

  async create(query: CreatePropertyMediaRequest) {
    const { queryBuilder, metadata, context, ...props } = query;
    const data = await this.prismaService.propertyMedia.create({
      data: {
        ...props,
        type: props.type as PropertyMediaType,
        metadata: metadata ? JSON.parse(metadata) : undefined,
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

  async update(query: UpdatePropertyMediaRequest) {
    const { queryBuilder, id, context: _, ...props } = query;
    const data = await this.prismaService.propertyMedia.update({
      where: { id },
      data: {
        ...props,
        type: props.type as PropertyMediaType,
        metadata: props.metadata ? JSON.parse(props.metadata) : undefined,
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

  async delete(query: DeletePropertyMediaRequest) {
    const { queryBuilder, id, purge } = query;
    let data: PropertyMedia;
    if (purge) {
      data = await this.prismaService.propertyMedia.delete({
        where: { id },
        ...this.representationService.buildCustomRepresentationQuery(
          queryBuilder?.v,
        ),
      });
    } else {
      data = await this.prismaService.propertyMedia.update({
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
