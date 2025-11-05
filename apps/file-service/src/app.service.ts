/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  CustomRepresentationService,
  FunctionFirstArgument,
  PaginationService,
  SortService,
} from '@hive/common';
import {
  CreateFileRequest,
  DeleteRequest,
  FileAuthZService,
  GenerateUploadSignedUrlRequest,
  GenerateUploadSignedUrlResponse,
  GetByHashRequest,
  GetRequest,
  QueryFileRequest,
} from '@hive/files';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { pick } from 'lodash';
import { PrismaService } from './prisma/prisma.service';
import { FileMetadata } from '../generated/prisma';
import { createHash } from 'crypto';
import { S3FileMetadata, S3Service } from './s3/s3.service';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
import { S3Config } from './s3/s3.config';

@Injectable()
export class AppService {
  private logger = new Logger(AppService.name);
  private readonly uploadPath = 'uploads';

  constructor(
    private readonly prismaService: PrismaService,
    private readonly sortService: SortService,
    private readonly paginationService: PaginationService,
    private readonly representationService: CustomRepresentationService,
    private readonly authz: FileAuthZService,
    private readonly s3Service: S3Service,
    private readonly config: S3Config,
  ) {}

  get s3(): S3Service {
    return this.s3Service;
  }

  private generateFileName(originalName: string): string {
    const fileId = uuidv4();
    const fileExtension = extname(originalName);
    return `${fileId}${fileExtension}`;
  }

  private generatePublicUrl(key: string): string {
    return `${this.config.endpoint}/${this.config.publicBucket}/${key}`;
  }

  async generateUploadSignedUrl(
    request: GenerateUploadSignedUrlRequest,
  ): Promise<GenerateUploadSignedUrlResponse> {
    const key = `${this.uploadPath}/${this.generateFileName(request.fileName)}`;
    const url = await this.s3Service.generateUploadSignedUrl(
      key,
      request.mimeType,
      request.expiresIn,
    );
    return {
      data: {
        signedUrl: url,
        fileName: this.generateFileName(request.fileName),
        originalName: request.fileName,
        expiresAt: new Date(
          Date.now() + (request.expiresIn ?? 3600) * 1000,
        ).toISOString(),
        mimeType: request.mimeType,
        key,
        storageUrl: this.generatePublicUrl(key),
      },
      metadata: JSON.stringify({}),
    };
  }

  async getAll(query: QueryFileRequest) {
    if (!query.context?.userId) {
      throw new RpcException(
        new BadRequestException('User ID is required in context'),
      );
    }
    // if (query.context?.organizationId) {
    //   const hasAccess = await this.authz.canViewOrganizationFiles(
    //     query.context.userId,
    //     query.context.organizationId,
    //   );
    //   if (!hasAccess)
    //     throw new RpcException(
    //       new ForbiddenException(
    //         'You do not have permission to view a file in this organization.',
    //       ),
    //     );
    //   viewableFiles = await this.authz.listOrganizationUserViewableFileObjects(
    //     query.context.userId,
    //     query.context.organizationId,
    //   );
    // }

    const dbQuery: FunctionFirstArgument<
      typeof this.prismaService.fileMetadata.findMany
    > = {
      where: {
        AND: [
          {
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
      this.prismaService.fileMetadata.findMany(dbQuery),
      this.prismaService.fileMetadata.count(pick(dbQuery, 'where')),
    ]);
    return {
      data,
      metadata: JSON.stringify({ totalCount: totalCount }),
    };
  }

  async getById(query: GetRequest) {
    const data = await this.prismaService.fileMetadata.findUnique({
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
  async getBlobByHash(query: GetByHashRequest) {
    const data = await this.prismaService.fileBlob.findUnique({
      where: {
        hash: query.hash,
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

  private generateFileHash(buffer: Buffer<ArrayBufferLike>): string {
    // Generate a SHA-256 hash of the file buffer and return as hex string
    const hash = createHash('sha256');
    hash.update(buffer);
    return hash.digest('hex');
  }

  async create(query: CreateFileRequest) {
    const { queryBuilder, context, blob, ...props } = query;
    if (!context?.userId) {
      throw new RpcException(
        new BadRequestException('User ID is required in context'),
      );
    }
    // if (
    //   context?.organizationId &&
    //   !(await this.authz.canCreateFile(context.userId, context.organizationId))
    // )
    //   throw new RpcException(
    //     new ForbiddenException(
    //       'You do not have permission to create a file in this organization.',
    //     ),
    //   );
    // TODO: eNHANCE VALIDATION to chech upload purpose scope scope and rules
    const buffer = Buffer.from(blob!.buffer);
    const hash = this.generateFileHash(buffer);

    // Check if the file already exists in the database
    const existingBlob = await this.prismaService.fileBlob.findUnique({
      where: { hash },
    });
    let uploaded: S3FileMetadata;
    if (!existingBlob) {
      uploaded = await this.s3Service.uploadSingleFile(
        blob!,
        this.uploadPath,
        true,
        {},
      );
    }

    const data = await this.prismaService.fileMetadata.create({
      data: {
        ...props,
        organizationId: context?.organizationId ?? undefined,
        uploadedById: context.userId,
        metadata: JSON.stringify({
          createdFromExistingBlob: existingBlob ? true : false,
        }),
        blobId: (existingBlob?.id ?? undefined) as string,
        originalName: blob!.originalName,
        blob: (existingBlob
          ? undefined
          : {
              create: {
                filename: uploaded!.filename,
                hash,
                mimeType: uploaded!.contentType,
                size: uploaded!.size,
                remoteId: uploaded!.id,
                storagePath: uploaded!.key,
                storageUrl: uploaded!.url,
                metadata: JSON.stringify({
                  ...(uploaded!.customMetadata ?? {}),
                  bucket: uploaded!.bucket,
                  key: uploaded!.key,
                  etag: uploaded!.etag,
                  uploadedAt: uploaded!.uploadedAt,
                }),
              },
            }) as any,
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

  async delete(query: DeleteRequest) {
    const { id, purge, queryBuilder } = query;
    let data: FileMetadata;
    if (purge) {
      data = await this.prismaService.fileMetadata.delete({
        where: { id },
        ...this.representationService.buildCustomRepresentationQuery(
          queryBuilder?.v,
        ),
      });
    } else {
      data = await this.prismaService.fileMetadata.update({
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

  async getDeduplicationStats() {
    const [totalFiles, uniqueBlobs, totalSize, deduplicatedSize] =
      await Promise.all([
        this.prismaService.fileMetadata.count(),
        this.prismaService.fileBlob.count(),
        this.prismaService.$queryRaw`
        SELECT COALESCE(SUM(size), 0) as total
        FROM file_metadata fm
        JOIN file_blobs fb ON fm."blobId" = fb.id
      `,
        this.prismaService.$queryRaw`
        SELECT COALESCE(SUM(size), 0) as total
        FROM file_blobs
      `,
      ]);

    return {
      totalFiles,
      uniqueBlobs,
      deduplicationRate: (
        ((totalFiles - uniqueBlobs) / totalFiles) *
        100
      ).toFixed(2),
      storageSaved:
        (totalSize as any)[0].total - (deduplicatedSize as any)[0].total,
    };
  }
}
