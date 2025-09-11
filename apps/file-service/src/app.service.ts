import {
  CustomRepresentationService,
  FunctionFirstArgument,
  PaginationService,
  SortService,
} from '@hive/common';
import {
  CreateFileRequest,
  DeleteRequest,
  GetRequest,
  QueryFileRequest,
} from '@hive/files';
import { Injectable } from '@nestjs/common';
import { Prisma, File } from '../generated/prisma';
import { PrismaService } from './prisma/prisma.service';
import { pick } from 'lodash';

@Injectable()
export class AppService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly sortService: SortService,
    private readonly paginationService: PaginationService,
    private readonly representationService: CustomRepresentationService,
  ) {}

  async getAll(query: QueryFileRequest) {
    const dbQuery: FunctionFirstArgument<
      typeof this.prismaService.file.findMany
    > = {
      where: {
        AND: [
          {
            voided: query?.includeVoided ? undefined : false,
            organizationId: query?.organizationId,
          },
          {
            OR: query.search
              ? [
                  { purpose: { contains: query.search } },
                  { relatedModelName: { contains: query.search } },
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
      this.prismaService.file.findMany(dbQuery),
      this.prismaService.file.count(pick(dbQuery, 'where')),
    ]);
    return {
      data,
      metadata: { totalCount: totalCount.toString() },
    };
  }

  async getById(query: GetRequest) {
    const data = await this.prismaService.file.findUnique({
      where: {
        id: query.id,
      },
      ...this.representationService.buildCustomRepresentationQuery(
        query.queryBuilder?.v,
      ),
    });
    return {
      data,
      metadata: {},
    };
  }

  async create(query: CreateFileRequest) {
    const { queryBuilder, ...props } = query;
    const data = await this.prismaService.file.create({
      data: props as any,
      ...this.representationService.buildCustomRepresentationQuery(
        queryBuilder?.v,
      ),
    });

    return {
      data,
      metadata: {},
    };
  }

  async delete(query: DeleteRequest) {
    const { id, purge, queryBuilder } = query;
    let data: File;
    if (purge) {
      data = await this.prismaService.file.delete({
        where: { id },
        ...this.representationService.buildCustomRepresentationQuery(
          queryBuilder?.v,
        ),
      });
    } else {
      data = await this.prismaService.file.update({
        where: { id },
        data: { voided: true },
        ...this.representationService.buildCustomRepresentationQuery(
          queryBuilder?.v,
        ),
      });
    }
    return {
      data,
      metadata: {},
    };
  }
}
