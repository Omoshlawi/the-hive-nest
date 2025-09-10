import { CustomRepresentationQueryDto } from '@hive/common';
import {
  FileMetadata,
  HiveFileServiceClient,
  RegisterFileRequest_StorageProvider,
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
import { S3Service } from '../s3/s3.service';
import { lastValueFrom } from 'rxjs';
import {createHash} from 'crypto';

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
        uploadFileDto.metadata,
      );
      const files = await lastValueFrom(
        this.fileService.registerFiles({
          fileMetadata: [
            {
              id: s3FileMetadata.id,
              key: s3FileMetadata.key,
              bucket: s3FileMetadata.bucket,
              filename: s3FileMetadata.filename,
              originalName: s3FileMetadata.originalName,
              contentType: s3FileMetadata.contentType,
              size: s3FileMetadata.size,
              isPublic: s3FileMetadata.isPublic,
              etag: s3FileMetadata.etag,
              url: s3FileMetadata.url,
              signedUrl: s3FileMetadata.signedUrl || s3FileMetadata.url,
              uploadedAt: s3FileMetadata.uploadedAt.toISOString(),
              customMetadata: s3FileMetadata.customMetadata ?? {},
              hash: this.generateFileHash(file.buffer),
            },
          ],
          category: 'From endpoint',
          contextType: '',
          orgarnizationId: '',
          provider: RegisterFileRequest_StorageProvider.LOCAL,
          queryBuilder: query,
          uploadedById: '',
          tags: ['From endpoint also'],
          uploadTo: s3FileMetadata.uploadTo,
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
