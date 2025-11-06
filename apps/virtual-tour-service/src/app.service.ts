import {
  CustomRepresentationService,
  FunctionFirstArgument,
  PaginationService,
  SortService,
} from '@hive/common';
import {
  CreateTourNestedScene,
  CreateTourRequest,
  DeleteRequest,
  GetRequest,
  QueryTourRequest,
  UpdateTourRequest,
} from '@hive/virtual-tour';
import { Injectable } from '@nestjs/common';
import { pick } from 'lodash';
import { PrismaService } from './prisma/prisma.service';
import { Prisma, Tour } from '../generated/prisma';
import { TileGeneratorService } from './tile-generator.service';
import { HiveFileServiceClient } from '@hive/files';
import { TileConfig } from './tile-generator.service';

interface CreateSceneDto {
  name: string;
  imageBuffer: Buffer;
  hotspots?: Array<{
    pitch: number;
    yaw: number;
    text: string;
    targetSceneId?: string;
  }>;
}

@Injectable()
export class TourService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly sortService: SortService,
    private readonly paginationService: PaginationService,
    private readonly representationService: CustomRepresentationService,
    private readonly tileGeneratorService: TileGeneratorService,
    private readonly fileServiceClient: HiveFileServiceClient,
  ) {}

  async getAll(query: QueryTourRequest) {
    const dbQuery: FunctionFirstArgument<
      typeof this.prismaService.tour.findMany
    > = {
      where: {
        AND: [
          { voided: query?.includeVoided ? undefined : false },
          { propertyId: query.propertyId },
          { listingId: query.listingId },
        ],
      },
      ...this.paginationService.buildPaginationQuery(query.queryBuilder),
      ...this.representationService.buildCustomRepresentationQuery(
        query.queryBuilder?.v,
      ),
      ...this.sortService.buildSortQuery(query.queryBuilder?.orderBy),
    };
    const [data, totalCount] = await Promise.all([
      this.prismaService.tour.findMany(dbQuery),
      this.prismaService.tour.count(pick(dbQuery, 'where')),
    ]);
    return {
      data,
      metadata: JSON.stringify({ totalCount: totalCount }),
    };
  }

  async getById(query: GetRequest) {
    const data = await this.prismaService.tour.findUnique({
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

  // private async prepareScenes(
  //   scenes: CreateTourNestedScene[] = [],
  // ): Promise<Array<TileConfig>> {
  //   const preparedScenes: Array<TileConfig> = [];
  //   for (const { fileUrl, name } of scenes) {
  //     const file = await this.fileServiceClient.getFile(fileUrl);
  //     const tileGenerator = await this.tileGeneratorService.generateTile(file);
  //     preparedScenes.push({ name, tileGenerator });
  //   }
  //   return preparedScenes;
  // }

  async create(query: CreateTourRequest) {
    const { queryBuilder, context: _, scenes, ...props } = query;

    const data = await this.prismaService.tour.create({
      data: { ...props, scenes: { createMany: { data: [] } } }, // TODO: Add scenes
      ...this.representationService.buildCustomRepresentationQuery(
        queryBuilder?.v,
      ),
    });

    return {
      data,
      metadata: JSON.stringify({}),
    };
  }

  async update(query: UpdateTourRequest) {
    const { queryBuilder, id, context: _, ...props } = query;
    const data = await this.prismaService.tour.update({
      where: { id },
      data: props as Prisma.TourUpdateInput,
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
    let data: Tour;
    if (purge) {
      data = await this.prismaService.tour.delete({
        where: { id },
        ...this.representationService.buildCustomRepresentationQuery(
          queryBuilder?.v,
        ),
      });
    } else {
      data = await this.prismaService.tour.update({
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
