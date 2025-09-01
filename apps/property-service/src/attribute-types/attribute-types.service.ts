import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CustomRepresentationService,
  FunctionFirstArgument,
  PaginationService,
  SortService,
} from '@hive/common';
import {
  CreatAttributeTypeDto,
  DeleteAttributeTypeDto,
  GetAttributeTypeDto,
  QueryAttributeTypeDto,
  UpdateAttributeTypeDto,
} from '@hive/property';
import { AttributeType } from '../../generated/prisma';
import { pick } from 'lodash';

@Injectable()
export class AttributeTypesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly sortService: SortService,
    private readonly paginationService: PaginationService,
    private readonly representationService: CustomRepresentationService,
  ) {}

  async getAll(query: QueryAttributeTypeDto) {
    const dbQuery: FunctionFirstArgument<
      typeof this.prismaService.attributeType.findMany
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
      this.prismaService.attributeType.findMany(dbQuery),
      this.prismaService.attributeType.count(pick(dbQuery, 'where')),
    ]);
    return {
      data,
      metadata: { totalCount },
    };
  }

  async getById(query: GetAttributeTypeDto) {
    const data = await this.prismaService.attributeType.findUnique({
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

  async create(query: CreatAttributeTypeDto) {
    const { v, ...props } = query;
    const data = await this.prismaService.attributeType.create({
      data: props,
      ...this.representationService.buildCustomRepresentationQuery(v),
    });

    return {
      data,
      metadata: {},
    };
  }

  async update(id: string, query: UpdateAttributeTypeDto) {
    const { v, ...props } = query;
    const data = this.prismaService.attributeType.update({
      where: { id },
      data: props,
      ...this.representationService.buildCustomRepresentationQuery(v),
    });

    return {
      data,
      metadata: {},
    };
  }
  async delete(id: string, query: DeleteAttributeTypeDto) {
    const { v, purge } = query;
    let data: AttributeType;
    if (purge) {
      data = await this.prismaService.attributeType.delete({
        where: { id },
        ...this.representationService.buildCustomRepresentationQuery(v),
      });
    } else {
      data = await this.prismaService.attributeType.update({
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
