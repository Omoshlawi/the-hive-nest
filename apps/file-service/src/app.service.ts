import {
  CustomRepresentationService,
  PaginationService,
  SortService,
} from '@hive/common';
import {
  FilesClient,
  RegisterFileRequest,
  RegisterFileResponse,
} from '@hive/files';
import { Injectable } from '@nestjs/common';
import { FileCategory, FileContext, Prisma } from '../generated/prisma';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly sortService: SortService,
    private readonly paginationService: PaginationService,
    private readonly representationService: CustomRepresentationService,
  ) {}
  async registerFiles(
    request: RegisterFileRequest,
  ): Promise<RegisterFileResponse> {
    const { queryBuilder, fileMetadata, ...props } = request;
    // TODO Validate organization based on Id, Cash Curr User as Uploader
    const ids = await this.prismaService.file.createManyAndReturn({
      select: { id: true },
      data: fileMetadata.map<Prisma.FileCreateManyInput>((meta) => ({
        filename: meta.filename,
        mimeType: meta.contentType,
        originalName: meta.originalName,
        size: parseInt(meta.size),
        hash: meta.hash,
        metadata: {
          ...meta.customMetadata,
          isPublic: meta.isPublic,
          bucket: meta.bucket,
          etag: meta.etag,
          key: meta.key,
          uploadedAt: meta.uploadedAt,
        },
        organizationId: props.orgarnizationId,
        tags: props.tags,
        uploadedById: props.uploadedById,
        contextType: props.contextType as unknown as FileContext,
        category: props.category as unknown as FileCategory,
        storages: {
          createMany: {
            skipDuplicates: true,
            data: {
              provider: props.provider,
              storagePath: props.uploadTo,
              storageUrl: meta.isPublic ? meta.url : meta.signedUrl,
            },
          },
        },
      })),
    });
    const data = await this.prismaService.file.findMany({
      where: { id: { in: ids.map((id) => id.id) } },
      ...this.representationService.buildCustomRepresentationQuery(
        queryBuilder?.v,
      ),
    });

    return {
      data: data.map((d) => ({
        ...d,
        metadata: JSON.stringify(d.metadata),
        storages: (d as any)?.storages ?? [],
        size: Number(d.size),
        uploadedBy: d.uploadedBy ? JSON.stringify(d.uploadedBy) : undefined,
        organization: d.organization
          ? JSON.stringify(d.organization)
          : undefined,
        organizationId: d.organizationId ?? undefined,
      })),
      metadata: {},
    } as unknown as RegisterFileResponse;
  }
}
