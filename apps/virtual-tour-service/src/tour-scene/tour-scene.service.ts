import {
  CustomRepresentationService,
  FunctionFirstArgument,
  PaginationService,
  SortService,
} from '@hive/common';
import {
  CreateSceneRequest,
  DeleteRequest,
  GetRequest,
  QuerySceneRequest,
  UpdateSceneRequest,
} from '@hive/virtual-tour';
import { Injectable } from '@nestjs/common';
import { Scene, Prisma } from '../../generated/prisma';
import { pick } from 'lodash';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TourSceneService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly sortService: SortService,
    private readonly paginationService: PaginationService,
    private readonly representationService: CustomRepresentationService,
  ) {}

  async getAll(query: QuerySceneRequest) {
    const dbQuery: FunctionFirstArgument<
      typeof this.prismaService.scene.findMany
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
      this.prismaService.scene.findMany(dbQuery),
      this.prismaService.scene.count(pick(dbQuery, 'where')),
    ]);
    return {
      data,
      metadata: JSON.stringify({ totalCount: totalCount }),
    };
  }

  async getById(query: GetRequest) {
    const data = await this.prismaService.scene.findUnique({
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

  async create(query: CreateSceneRequest) {
    const { queryBuilder, context: _, ...props } = query;
    const data = await this.prismaService.scene.create({
      data: { ...props, tileBaseUrl: '', width: 0, height: 0, maxLevel: 0 }, // TODO: Add tileBaseUrl, width, height, maxLevel
      ...this.representationService.buildCustomRepresentationQuery(
        queryBuilder?.v,
      ),
    });

    return {
      data,
      metadata: JSON.stringify({}),
    };
  }

  async update(query: UpdateSceneRequest) {
    const { queryBuilder, id, context: _, ...props } = query;
    const data = await this.prismaService.scene.update({
      where: { id },
        data: { ...props, tileBaseUrl: '', width: 0, height: 0, maxLevel: 0 }, // TODO: Add tileBaseUrl, width, height, maxLevel
      ...this.representationService.buildCustomRepresentationQuery(
        queryBuilder?.v,
      ),
    });

    return {
      data,
      metadata: JSON.stringify({}),
    };
  }

  async delete(query: DeleteRequest) {
    const { id, purge, queryBuilder } = query;
    let data: Scene;
    if (purge) {
      data = await this.prismaService.scene.delete({
        where: { id },
        ...this.representationService.buildCustomRepresentationQuery(
          queryBuilder?.v,
        ),
      });
    } else {
      data = await this.prismaService.scene.update({
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
