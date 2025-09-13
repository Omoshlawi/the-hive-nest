import {
  CustomRepresentationService,
  FunctionFirstArgument,
  PaginationService,
  SortService,
} from '@hive/common';
import {
  CreateFileRequest,
  CreateFileStorage_StorageProviders,
  DeleteRequest,
  GetRequest,
  QueryFileRequest,
} from '@hive/files';
import { Injectable, Logger } from '@nestjs/common';
import { Prisma, File, StorageProvider } from '../generated/prisma';
import { PrismaService } from './prisma/prisma.service';
import { pick } from 'lodash';

@Injectable()
export class AppService {
  private logger = new Logger(AppService.name);
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

  private resolveproviderEnum(
    provider: CreateFileStorage_StorageProviders,
  ): StorageProvider {
    switch (provider) {
      case CreateFileStorage_StorageProviders.AWS_S3:
        return 'AWS_S3';
      case CreateFileStorage_StorageProviders.AZURE_BLOB:
        return 'AZURE_BLOB';
      case CreateFileStorage_StorageProviders.CLOUDFLARE_R2:
        return 'CLOUDFLARE_R2';
      case CreateFileStorage_StorageProviders.GOOGLE_CLOUD:
        return 'GOOGLE_CLOUD';
      case CreateFileStorage_StorageProviders.LOCAL:
        return 'LOCAL';
      default:
        this.logger.error('Error Resolving Storage provider enum');
        throw new Error('Uknonke Storage provider');
    }
  }

  async create(query: CreateFileRequest) {
    const { queryBuilder, ...props } = query;
    const data = await this.prismaService.file.create({
      data: {
        ...props,
        size: parseInt(props.size),
        storages: {
          createMany: {
            skipDuplicates: true,
            data: props.storages.map((storage) => ({
              ...storage,
              provider: this.resolveproviderEnum(storage.provider),
            })),
          },
        },
      },
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
