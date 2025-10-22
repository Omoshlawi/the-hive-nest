/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { CustomRepresentationQueryDto, DeleteQueryDto } from '@hive/common';
import {
  FileBlob,
  GetFileByHashQueryDto,
  HiveFileServiceClient,
  QueryFileDto,
  UploadFilesDto,
  UploadMutipleFilesDto,
  UploadSingleFileDto,
} from '@hive/files';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  MaxFileSizeValidator,
  Param,
  ParseFilePipeBuilder,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import {
  AnyFilesInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { OptionalAuth, Session } from '@thallesp/nestjs-better-auth';
import { createHash } from 'crypto';
import { lastValueFrom, map } from 'rxjs';
import {
  ApiDetailTransformInterceptor,
  ApiListTransformInterceptor,
} from '../app.interceptors';
import { UserSession } from '../auth/auth.types';
import { S3Service } from '../s3/s3.service';

@Controller('files')
export class FilesController {
  private readonly logger = new Logger(FilesController.name);
  private readonly uploadPath = 'uploads';
  constructor(
    private readonly s3Service: S3Service,
    private readonly fileService: HiveFileServiceClient,
  ) {}

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private generateFileHash(buffer: Buffer<ArrayBufferLike>): string {
    // Generate a SHA-256 hash of the file buffer and return as hex string
    const hash = createHash('sha256');
    hash.update(buffer);
    return hash.digest('hex');
  }

  @Get('/')
  @UseInterceptors(ApiListTransformInterceptor)
  @ApiOperation({ summary: 'Query File' })
  queryFile(
    @Query() query: QueryFileDto,
    @Session() { user, session }: UserSession,
  ) {
    return this.fileService.file
      .queryFile({
        queryBuilder: {
          limit: query.limit,
          orderBy: query.orderBy,
          page: query.page,
          v: query.v,
        },
        includeVoided: query.includeVoided,
        search: query.search,
        context: {
          userId: user.id,
          organizationId: session?.activeOrganizationId ?? undefined,
        },
      })
      .pipe(
        map((value) => ({
          results: value?.data ?? [],
          ...JSON.parse(value.metadata),
        })),
      );
  }

  @Get('/hash')
  @OptionalAuth()
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Get FileBlob by hash' })
  getFileByHash(
    @Query() query: GetFileByHashQueryDto,
    @Session() { user, session }: UserSession,
  ) {
    return this.fileService.file.getBlobByHash({
      hash: query.hash,
      queryBuilder: query,
      context: {
        userId: user.id,
        organizationId: session?.activeOrganizationId ?? undefined,
      },
    });
  }

  @Get('/:id')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Get File' })
  getFile(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: CustomRepresentationQueryDto,
    @Session() { user, session }: UserSession,
  ) {
    return this.fileService.file.getFile({
      id,
      queryBuilder: query,
      context: {
        userId: user.id,
        organizationId: session?.activeOrganizationId ?? undefined,
      },
    });
  }

  private async getBlobByHashIfFileExists(hash: string) {
    try {
      const res = await lastValueFrom(
        this.fileService.file.getBlobByHash({
          hash,
          queryBuilder: {},
        }),
      );
      return res?.data;
    } catch (e: any) {
      this.logger.error('Error getting blob by id ' + e?.message);
      return null;
    }
  }

  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload single file',
    description: 'Upload a single file to the specified location',
  })
  @Post('upload/single')
  async uploadSingleFile(
    @UploadedFile(
      'file',
      new ParseFilePipeBuilder()
        .addValidator(new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 })) // 10MB
        .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }),
    )
    file: Express.Multer.File,
    @Query() query: CustomRepresentationQueryDto,
    @Body() uploadFileDto: UploadSingleFileDto,
    @Session() { user, session }: UserSession,
  ) {
    this.logger.log(
      `S3 single file upload: ${file.originalname} (${this.formatFileSize(file.size)})`,
    );
    const fileHash = this.generateFileHash(file.buffer);
    const alreadyExist = await this.getBlobByHashIfFileExists(fileHash);
    if (alreadyExist) {
      return this.fileService.file.createFileFromExistingBlob({
        queryBuilder: query,
        purpose: uploadFileDto.purpose,
        relatedModelId: uploadFileDto.relatedModelId,
        relatedModelName: uploadFileDto.relatedModelName,
        tags: uploadFileDto.tags?.split(',')?.map((t) => t.trim()),
        expiresAt: undefined, // TODO Future impl
        lastAccessedAt: undefined, // TODO Future impl
        context: {
          userId: user.id,
          organizationId: session?.activeOrganizationId ?? undefined,
        },
        blobId: alreadyExist.id,
        originalName: file.originalname,
        metadata: JSON.stringify({ createdFromExistingBlob: true }),
      });
    }

    try {
      const s3FileMetadata = await this.s3Service.uploadSingleFile(
        file,
        this.uploadPath, // Can not use model name or purpose for destination folders since differnct users can upload the same file for diferent purpose
        true,
        {},
      );
      return this.fileService.file.createFile({
        queryBuilder: query,
        originalName: s3FileMetadata.originalName,
        purpose: uploadFileDto.purpose,
        relatedModelId: uploadFileDto.relatedModelId,
        relatedModelName: uploadFileDto.relatedModelName,
        tags: uploadFileDto.tags?.split(',')?.map((t) => t.trim()),
        metadata: JSON.stringify({
          createdFromExistingBlob: false,
        }),
        expiresAt: undefined, // TODO Future impl
        lastAccessedAt: undefined, // TODO Future impl
        context: {
          userId: user.id,
          organizationId: session?.activeOrganizationId ?? undefined,
        },
        blob: {
          filename: s3FileMetadata.filename,
          hash: fileHash,
          metadata: JSON.stringify({
            ...(s3FileMetadata.customMetadata ?? {}),
            bucket: s3FileMetadata.bucket,
          }),
          mimeType: s3FileMetadata.contentType,
          remoteId: s3FileMetadata.id,
          size: s3FileMetadata.size.toString(),
          storagePath: 'uploads', // TODO: use correct path
          storageUrl: s3FileMetadata.url,
        },
      });
    } catch (error) {
      this.logger.error(
        `S3 upload failed for ${file.originalname}: ${error?.message}`,
        error?.stack,
      );
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Upload failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Post('upload/multiple')
  @ApiOperation({
    summary: 'Upload multiple files',
    description:
      'Upload multiple files with the same field name to the specified location',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadMultipleFile(
    @UploadedFiles(
      new ParseFilePipeBuilder()
        .addValidator(new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 })) // 10MB per file
        .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }),
    )
    files: Array<Express.Multer.File>,
    @Session() { user, session }: UserSession,
    @Query() query: CustomRepresentationQueryDto,
    @Body() uploadFileDto: UploadMutipleFilesDto,
  ) {
    try {
      const checkIfAlreadyUploaded = await Promise.all(
        files.map((file) =>
          this.getBlobByHashIfFileExists(this.generateFileHash(file.buffer)),
        ),
      );
      const existingFiles: Array<Express.Multer.File> = [];
      const newFiles: Array<Express.Multer.File> = [];
      checkIfAlreadyUploaded.forEach((blob, index) => {
        if (blob) {
          existingFiles.push(files[index]);
        } else {
          newFiles.push(files[index]);
        }
      });
      const existingBlobs = checkIfAlreadyUploaded.filter(
        Boolean,
      ) as Array<FileBlob>;

      const s3FileMetadata = await this.s3Service.uploadMultipleFiles(
        newFiles,
        this.uploadPath,
        true,
        {},
      );

      // New Uploads
      const newUploadTasks = s3FileMetadata.files.map(async (file, index) => {
        return await lastValueFrom(
          this.fileService.file.createFile({
            queryBuilder: query,
            originalName: file.originalName,
            purpose: uploadFileDto.purpose,
            relatedModelId: uploadFileDto.relatedModelId,
            relatedModelName: uploadFileDto.relatedModelName,
            blob: {
              filename: file.filename,
              hash: this.generateFileHash(files[index].buffer),
              mimeType: file.contentType,
              remoteId: file.id,
              size: file.size.toString(),
              storagePath: 'uploads', // TODO: use correct path,
              storageUrl: file.url,
              metadata: JSON.stringify({
                ...(file.customMetadata ?? {}),
                bucket: file.bucket,
              }),
            },
            tags: uploadFileDto.tags?.split(',')?.map((t) => t.trim()),
            expiresAt: undefined, // TODO Future impl
            lastAccessedAt: undefined, // TODO Future impl,
            context: {
              userId: user.id,
              organizationId: session?.activeOrganizationId ?? undefined,
            },
            metadata: JSON.stringify({
              createdFromExistingBlob: false,
            }),
          }),
        );
      });
      // Existing blobs
      const existingUploadTasks = existingBlobs.map((alreadyExist, i) =>
        lastValueFrom(
          this.fileService.file.createFileFromExistingBlob({
            queryBuilder: query,
            purpose: uploadFileDto.purpose,
            relatedModelId: uploadFileDto.relatedModelId,
            relatedModelName: uploadFileDto.relatedModelName,
            tags: uploadFileDto.tags?.split(',')?.map((t) => t.trim()),
            expiresAt: undefined, // TODO Future impl
            lastAccessedAt: undefined, // TODO Future impl
            context: {
              userId: user.id,
              organizationId: session?.activeOrganizationId ?? undefined,
            },
            blobId: alreadyExist.id,
            originalName: existingFiles[i].originalname,
            metadata: JSON.stringify({ createdFromExistingBlob: true }),
          }),
        ),
      );
      // TODO Handle other errors apart from unique hash fields e.g Minio Upload related errors, also other error from remote server
      const res = await Promise.allSettled([
        ...newUploadTasks,
        ...existingUploadTasks,
      ]);
      const success = res
        .filter((r) => r.status === 'fulfilled')
        .map((r) => r.value.data);
      return { files: success };
    } catch (error) {
      this.logger.error(`S3 upload failed : ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Upload failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Post('upload/multiple/fields')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload files from multiple form fields',
    description:
      'Upload files from different form fields to the specified location',
  })
  @UseInterceptors(AnyFilesInterceptor())
  async uploadFiles(
    @UploadedFiles(
      new ParseFilePipeBuilder()
        .addValidator(new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 })) // 10MB per file
        // .addValidator(
        //   new FileTypeValidator({
        //     fileType: /\.(jpg|jpeg|png|gif|pdf|doc|docx|txt)$/,
        //   }),
        // )
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          fileIsRequired: false, // Allow empty uploads for this endpoint
        }),
    )
    files: Array<Express.Multer.File>,
    @Session() { user, session }: UserSession,
    @Query() query: CustomRepresentationQueryDto,
    @Body() uploadFileDto: UploadFilesDto,
  ) {
    try {
      const checkIfAlreadyUploaded = await Promise.all(
        files.map((file) =>
          this.getBlobByHashIfFileExists(this.generateFileHash(file.buffer)),
        ),
      );
      const existingFiles: Array<Express.Multer.File> = [];
      const newFiles: Array<Express.Multer.File> = [];
      checkIfAlreadyUploaded.forEach((blob, index) => {
        if (blob) {
          existingFiles.push(files[index]);
        } else {
          newFiles.push(files[index]);
        }
      });
      const existingBlobs = checkIfAlreadyUploaded.filter(
        Boolean,
      ) as Array<FileBlob>;

      const s3FileMetadata = await this.s3Service.uploadMultipleFiles(
        newFiles,
        this.uploadPath,
        true,
        {},
      );

      // New Uploads
      const newUploadTasks = s3FileMetadata.files.map(async (file, index) => {
        return await lastValueFrom(
          this.fileService.file.createFile({
            queryBuilder: query,
            originalName: file.originalName,
            purpose: uploadFileDto.purpose,
            relatedModelId: uploadFileDto.relatedModelId,
            relatedModelName: uploadFileDto.relatedModelName,
            blob: {
              filename: file.filename,
              hash: this.generateFileHash(files[index].buffer),
              mimeType: file.contentType,
              remoteId: file.id,
              size: file.size.toString(),
              storagePath: 'uploads', // TODO: use correct path,
              storageUrl: file.url,
              metadata: JSON.stringify({
                ...(file.customMetadata ?? {}),
                bucket: file.bucket,
              }),
            },
            tags: uploadFileDto.tags?.split(',')?.map((t) => t.trim()),
            expiresAt: undefined, // TODO Future impl
            lastAccessedAt: undefined, // TODO Future impl,
            context: {
              userId: user.id,
              organizationId: session?.activeOrganizationId ?? undefined,
            },
            metadata: JSON.stringify({
              createdFromExistingBlob: false,
            }),
          }),
        );
      });
      // Existing blobs
      const existingUploadTasks = existingBlobs.map((alreadyExist, i) =>
        lastValueFrom(
          this.fileService.file.createFileFromExistingBlob({
            queryBuilder: query,
            purpose: uploadFileDto.purpose,
            relatedModelId: uploadFileDto.relatedModelId,
            relatedModelName: uploadFileDto.relatedModelName,
            tags: uploadFileDto.tags?.split(',')?.map((t) => t.trim()),
            expiresAt: undefined, // TODO Future impl
            lastAccessedAt: undefined, // TODO Future impl
            context: {
              userId: user.id,
              organizationId: session?.activeOrganizationId ?? undefined,
            },
            blobId: alreadyExist.id,
            originalName: existingFiles[i].originalname,
            metadata: JSON.stringify({ createdFromExistingBlob: true }),
          }),
        ),
      );
      // TODO Handle other errors apart from unique hash fields e.g Minio Upload related errors, also other error from remote server
      const res = await Promise.allSettled([
        ...newUploadTasks,
        ...existingUploadTasks,
      ]);
      const success = res
        .filter((r) => r.status === 'fulfilled')
        .map((r) => r.value.data);
      return { files: success };
    } catch (error) {
      this.logger.error(`S3 upload failed : ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Upload failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('/:id')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Delete File' })
  delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DeleteQueryDto,
    @Session() { user, session }: UserSession,
  ) {
    return this.fileService.file.deleteFile({
      id,
      queryBuilder: { v: query.v },
      purge: query.purge,
      context: {
        userId: user.id,
        organizationId: session?.activeOrganizationId ?? undefined,
      },
    });
  }
}
