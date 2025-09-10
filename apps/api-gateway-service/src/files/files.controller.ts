import { CustomRepresentationQueryDto } from '@hive/common';
import {
  CreateFileStorage_StorageProviders,
  HiveFileServiceClient,
  UploadFilesDto,
  UploadMutipleFilesDto,
  UploadSingleFileDto,
} from '@hive/files';
import {
  Body,
  Controller,
  FileTypeValidator,
  HttpException,
  HttpStatus,
  Logger,
  MaxFileSizeValidator,
  ParseFilePipeBuilder,
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
import { createHash } from 'crypto';
import { lastValueFrom } from 'rxjs';
import { S3Service } from '../s3/s3.service';

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
        // .addValidator(
        //   new FileTypeValidator({
        //     fileType: /\.(jpg|jpeg|png|gif|pdf|doc|docx|txt)$/,
        //   }),
        // )
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
        this.fileService.files.createFile({
          queryBuilder: query,
          category: '',
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
          uploadedById: '',
          expiresAt: '',
          lastAccessedAt: '',
          metadata: JSON.stringify(s3FileMetadata.customMetadata ?? {}),
          organizationId: '',
        }),
      );
      return files[0];
    } catch (error) {
      this.logger.error(
        `S3 upload failed for ${file.originalname}: ${error.message}`,
        error.stack,
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
  uploadMultipleFile(
    @UploadedFiles(
      new ParseFilePipeBuilder()
        .addValidator(new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 })) // 10MB per file
        .addValidator(
          new FileTypeValidator({
            fileType: /\.(jpg|jpeg|png|gif|pdf|doc|docx|txt)$/,
          }),
        )
        .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }),
    )
    files: Array<Express.Multer.File>,
    @Query() query: CustomRepresentationQueryDto,
    @Body() uploadFileDto: UploadMutipleFilesDto,
  ) {
    console.log(files);
    console.log(uploadFileDto);
  }
  @Post('upload/multiple/fields')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload files from multiple form fields',
    description:
      'Upload files from different form fields to the specified location',
  })
  @UseInterceptors(AnyFilesInterceptor())
  uploadFiles(
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
    file: Array<Express.Multer.File>,
    @Query() query: CustomRepresentationQueryDto,
    @Body() uploadFileDto: UploadFilesDto,
  ) {
    console.log(file);
    console.log(uploadFileDto);
  }
}
