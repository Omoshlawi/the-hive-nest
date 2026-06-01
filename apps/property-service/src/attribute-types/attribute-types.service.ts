import {
  CustomRepresentationService,
  PaginationService,
  SortService,
} from '@hive/common';
import {
  CreateAttributeTypeRequest,
  DeleteAttributeTypeRequest,
  GetAttributeTypeRequest,
  QueryAttributeTypeRequest,
  UpdateAttributeTypeRequest,
} from '@hive/property';
import { Injectable } from '@nestjs/common';
import { AttributeType, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttributeTypesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly sortService: SortService,
    private readonly paginationService: PaginationService,
    private readonly representationService: CustomRepresentationService,
  ) {}

  async getAll(query: QueryAttributeTypeRequest) {
    const dbQuery: Prisma.AttributeTypeWhereInput = {
      AND: [
        { voided: query?.includeVoided ? undefined : false },
        {
          OR: query.search ? [{ name: { contains: query.search } }] : undefined,
        },
      ],
    };
    const totalCount = await this.prismaService.attributeType.count({
      where: dbQuery,
    });
    const data = await this.prismaService.attributeType.findMany({
      where: dbQuery,
      ...this.paginationService.buildSafePaginationQuery(
        query.queryBuilder,
        totalCount,
      ),
      ...this.representationService.buildCustomRepresentationQuery(
        query.queryBuilder?.v,
      ),
      ...this.sortService.buildSortQuery(query.queryBuilder?.orderBy),
    });
    return {
      data,
      metadata: JSON.stringify({ totalCount }),
    };
  }

  async getById(query: GetAttributeTypeRequest) {
    const data = await this.prismaService.attributeType.findUnique({
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

  async create(query: CreateAttributeTypeRequest) {
    const { queryBuilder, ...props } = query;
    const data = await this.prismaService.attributeType.create({
      data: props as unknown as Prisma.AttributeTypeCreateInput,
      ...this.representationService.buildCustomRepresentationQuery(
        queryBuilder?.v,
      ),
    });

    return {
      data,
      metadata: JSON.stringify({}),
    };
  }

  async update(query: UpdateAttributeTypeRequest) {
    const { queryBuilder, id, ...props } = query;
    const data = await this.prismaService.attributeType.update({
      where: { id },
      data: props as unknown as Prisma.AttributeTypeCreateInput,
      ...this.representationService.buildCustomRepresentationQuery(
        queryBuilder?.v,
      ),
    });

    return {
      data,
      metadata: JSON.stringify({}),
    };
  }
  async delete(query: DeleteAttributeTypeRequest) {
    const { queryBuilder, id, purge } = query;
    let data: AttributeType;
    if (purge) {
      data = await this.prismaService.attributeType.delete({
        where: { id },
        ...this.representationService.buildCustomRepresentationQuery(
          queryBuilder?.v,
        ),
      });
    } else {
      data = await this.prismaService.attributeType.update({
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
