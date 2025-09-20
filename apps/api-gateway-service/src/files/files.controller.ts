import { CustomRepresentationQueryDto, DeleteQueryDto } from '@hive/common';
import {
  CreateFileStorage_StorageProviders,
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
  FileTypeValidator,
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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  AnyFilesInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { createHash } from 'crypto';
import { lastValueFrom } from 'rxjs';
import { S3Service } from '../s3/s3.service';
import { AuthGuard, Session, UserSession } from '@mguay/nestjs-better-auth';

// TODO: implement deduplication of files by generating file hash and cross checking on dab if exist then retuern reference
// Also implement methods to validate before uploading to bucket

@UseGuards(AuthGuard)
@Controller('files')
export class FilesController {
  private readonly logger = new Logger(FilesController.name);
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
  @ApiOperation({ summary: 'Query File' })
  queryFile(@Query() query: QueryFileDto) {
    return this.fileService.file.queryFile({
      queryBuilder: {
        limit: query.limit,
        orderBy: query.orderBy,
        page: query.page,
        v: query.v,
      },
      includeVoided: query.includeVoided,
      organizationId: query.organizationId,
      search: query.search,
    });
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get File' })
  getFileUsageRule(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.fileService.file.getFile({
      id,
      queryBuilder: query,
    });
  }

  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload single file',
    description: 'Upload a single file to the specified location',
  })
  @Post('upload/single')
  async uploadSingleFile(
    @Session() { user }: UserSession,
    @UploadedFile(
      'file',
      new ParseFilePipeBuilder()
        .addValidator(new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 })) // 10MB
        .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }),
    )
    file: Express.Multer.File,
    @Query() query: CustomRepresentationQueryDto,
    @Body() uploadFileDto: UploadSingleFileDto,
  ) {
    this.logger.log(
      `S3 single file upload: ${file.originalname} (${this.formatFileSize(file.size)})`,
    );

    try {
      const s3FileMetadata = await this.s3Service.uploadSingleFile(
        file,
        uploadFileDto.uploadTo,
        uploadFileDto.isPublic,
        {},
      );
      const files = await lastValueFrom(
        this.fileService.file.createFile({
          queryBuilder: query,
          filename: s3FileMetadata.filename,
          hash: this.generateFileHash(file.buffer),
          mimeType: s3FileMetadata.contentType,
          originalName: s3FileMetadata.originalName,
          purpose: uploadFileDto.purpose,
          relatedModelId: uploadFileDto.relatedModelId,
          relatedModelName: uploadFileDto.relatedModelName,
          size: s3FileMetadata.size.toString(),
          storages: [
            {
              provider: CreateFileStorage_StorageProviders.LOCAL,
              remoteId: s3FileMetadata.id,
              storagePath: uploadFileDto.uploadTo,
              storageUrl: s3FileMetadata.url ?? s3FileMetadata.signedUrl,
            },
          ],
          tags: uploadFileDto.tags?.split(',')?.map((t) => t.trim()),
          uploadedById: user.id,
          metadata: JSON.stringify(s3FileMetadata.customMetadata ?? {}),
          organizationId: undefined,
          expiresAt: undefined, // TODO Future impl
          lastAccessedAt: undefined, // TODO Future impl
        }),
      );
      return files;
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
    @Session() { user }: UserSession,
    @Query() query: CustomRepresentationQueryDto,
    @Body() uploadFileDto: UploadMutipleFilesDto,
  ) {
    try {
      const s3FileMetadata = await this.s3Service.uploadMultipleFiles(
        files,
        uploadFileDto.uploadTo,
        uploadFileDto.isPublic,
        {},
      );

      const uploadTasks = s3FileMetadata.files.map((file, index) =>
        lastValueFrom(
          this.fileService.file.createFile({
            queryBuilder: query,
            filename: file.filename,
            hash: this.generateFileHash(files[index].buffer),
            mimeType: file.contentType,
            originalName: file.originalName,
            purpose: uploadFileDto.purpose,
            relatedModelId: uploadFileDto.relatedModelId,
            relatedModelName: uploadFileDto.relatedModelName,
            size: file.size.toString(),
            storages: [
              {
                provider: CreateFileStorage_StorageProviders.LOCAL,
                remoteId: file.id,
                storagePath: uploadFileDto.uploadTo,
                storageUrl: file.url ?? file.signedUrl,
              },
            ],
            tags: uploadFileDto.tags?.split(',')?.map((t) => t.trim()),
            uploadedById: user.id,
            metadata: JSON.stringify(file.customMetadata ?? {}),
            organizationId: undefined,
            expiresAt: undefined, // TODO Future impl
            lastAccessedAt: undefined, // TODO Future impl
          }),
        ),
      );
      const res = await Promise.allSettled(uploadTasks);
      const success = res
        .filter((r) => r.status === 'fulfilled')
        .map((r) => r.value.data);
      return success;
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
        .addValidator(
          new FileTypeValidator({
            fileType: /\.(jpg|jpeg|png|gif|pdf|doc|docx|txt)$/,
          }),
        )
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          fileIsRequired: false, // Allow empty uploads for this endpoint
        }),
    )
    files: Array<Express.Multer.File>,
    @Session() { user }: UserSession,
    @Query() query: CustomRepresentationQueryDto,
    @Body() uploadFileDto: UploadFilesDto,
  ) {
    try {
      const s3FileMetadata = await this.s3Service.uploadMultipleFiles(
        files,
        uploadFileDto.uploadTo,
        uploadFileDto.isPublic,
        {},
      );

      const uploadTasks = s3FileMetadata.files.map((file, index) =>
        lastValueFrom(
          this.fileService.file.createFile({
            queryBuilder: query,
            filename: file.filename,
            hash: this.generateFileHash(files[index].buffer),
            mimeType: file.contentType,
            originalName: file.originalName,
            purpose: uploadFileDto.purpose,
            relatedModelId: uploadFileDto.relatedModelId,
            relatedModelName: uploadFileDto.relatedModelName,
            size: file.size.toString(),
            storages: [
              {
                provider: CreateFileStorage_StorageProviders.LOCAL,
                remoteId: file.id,
                storagePath: uploadFileDto.uploadTo,
                storageUrl: file.url ?? file.signedUrl,
              },
            ],
            tags: uploadFileDto.tags?.split(',')?.map((t) => t.trim()),
            uploadedById: user.id,
            metadata: JSON.stringify(file.customMetadata ?? {}),
            organizationId: undefined,
            expiresAt: undefined, // TODO Future impl
            lastAccessedAt: undefined, // TODO Future impl
          }),
        ),
      );
      const res = await Promise.allSettled(uploadTasks);
      const success = res
        .filter((r) => r.status === 'fulfilled')
        .map((r) => r.value.data);
      return success;
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
  @ApiOperation({ summary: 'Delete File' })
  deleteFileUsageRule(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DeleteQueryDto,
  ) {
    return this.fileService.file.deleteFile({
      id,
      queryBuilder: { v: query.v },
      purge: query.purge,
    });
  }
}
