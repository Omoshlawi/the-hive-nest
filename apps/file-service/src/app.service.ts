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
  FileAuthZService,
  GetRequest,
  QueryFileRequest,
} from '@hive/files';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Prisma, File, StorageProvider } from '../generated/prisma';
import { PrismaService } from './prisma/prisma.service';
import { pick } from 'lodash';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class AppService {
  private logger = new Logger(AppService.name);
  constructor(
    private readonly prismaService: PrismaService,
    private readonly sortService: SortService,
    private readonly paginationService: PaginationService,
    private readonly representationService: CustomRepresentationService,
    private readonly authz: FileAuthZService,
  ) {}

  async getAll(query: QueryFileRequest) {
    let viewableFiles: string[] | undefined;
    if (!query.context?.userId) {
      throw new RpcException(
        new BadRequestException('User ID is required in context'),
      );
    }
    if (query.context?.organizationId) {
      const hasAccess = await this.authz.canViewOrganizationFiles(
        query.context!.userId!,
        query.context.organizationId,
      );
      if (!hasAccess)
        throw new RpcException(
          new ForbiddenException(
            'You do not have permission to view a file in this organization.',
          ),
        );
      viewableFiles = await this.authz.listOrganizationUserViewableFileObjects(
        query.context.userId,
        query.context.organizationId,
      );
    }

    const dbQuery: FunctionFirstArgument<
      typeof this.prismaService.file.findMany
    > = {
      where: {
        AND: [
          {
            id: viewableFiles && { in: viewableFiles },
            voided: query?.includeVoided ? undefined : false,
            organizationId: query.context?.organizationId,
            uploadedById: query.context?.organizationId
              ? undefined
              : query.context?.userId,
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
    const { queryBuilder, context, ...props } = query;
    if (!context?.userId) {
      throw new RpcException(
        new BadRequestException('User ID is required in context'),
      );
    }
    if (
      context?.organizationId &&
      !(await this.authz.canCreateFile(context.userId, context.organizationId))
    )
      throw new RpcException(
        new ForbiddenException(
          'You do not have permission to create a file in this organization.',
        ),
      );
    // TODO: eNHANCE VALIDATION to chech upload purpose scope scope and rules
    const data = await this.prismaService.file.create({
      data: {
        ...props,
        size: parseInt(props.size),
        organizationId: context?.organizationId,
        uploadedById: context!.userId!,
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
    const { id, purge, queryBuilder, context } = query;
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
