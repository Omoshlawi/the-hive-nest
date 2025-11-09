/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import {
  ApiErrorsResponse,
  CustomRepresentationQueryDto,
  DeleteQueryDto,
} from '@hive/common';
import {
  CompleteFileUploadDto,
  GetFileByHashQueryDto,
  HiveFileServiceClient,
  QueryFileDto,
  QueryReqestFileUploadDto,
  RequestFileUploadDto,
  RequestFileUploadResponseDto,
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
import { ApiConsumes, ApiCreatedResponse, ApiOperation } from '@nestjs/swagger';
import { OptionalAuth, Session } from '@thallesp/nestjs-better-auth';
import {
  ApiDetailTransformInterceptor,
  ApiListTransformInterceptor,
} from '../app.interceptors';
import { UserSession } from '../auth/auth.types';

@Controller('files')
export class FilesController {
  private readonly logger = new Logger(FilesController.name);
  constructor(private readonly fileService: HiveFileServiceClient) {}

  @Get('/')
  @UseInterceptors(ApiListTransformInterceptor)
  @ApiOperation({ summary: 'Query File' })
  queryFile(
    @Query() query: QueryFileDto,
    @Session() { user, session }: UserSession,
  ) {
    return this.fileService.file.queryFile({
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
    });
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

  @Post('/upload/request')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Request file upload' })
  @ApiCreatedResponse({ type: RequestFileUploadResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  requestFileUpload(
    @Body() requestFileUploadDto: RequestFileUploadDto,
    @Query() query: QueryReqestFileUploadDto,
    @Session() { user, session }: UserSession,
  ) {
    return this.fileService.file.generateUploadSignedUrl({
      ...requestFileUploadDto,
      tags: requestFileUploadDto.tags ?? [],
      size: requestFileUploadDto.size.toString(),
      context: {
        userId: user.id,
        organizationId: query.organization
          ? session?.activeOrganizationId
          : undefined,
      },
    });
  }

  @Get('upload/complete')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Complete File Upload' })
  // @ApiCreatedResponse({ type: GetFileResponseDto })
  @ApiErrorsResponse({})
  completeFileUpload(
    @Query() query: CompleteFileUploadDto,
    @Session() { user, session }: UserSession,
  ) {
    return this.fileService.file.completeFileUpload({
      id: query.id,
      queryBuilder: {
        v: query.v,
      },
      context: {
        userId: user.id,
        organizationId: session?.activeOrganizationId ?? undefined,
      },
    });
  }

  @Post('upload/single')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload single file',
    description: 'Upload a single file to the specified location',
  })
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
    return this.fileService.file.createFile({
      queryBuilder: query,
      purpose: uploadFileDto.purpose,
      relatedModelId: uploadFileDto.relatedModelId,
      relatedModelName: uploadFileDto.relatedModelName,
      tags: uploadFileDto.tags?.split(',')?.map((t) => t.trim()),
      expiresAt: undefined, // TODO Future impl
      context: {
        userId: user.id,
        organizationId: session?.activeOrganizationId ?? undefined,
      },
      blob: {
        name: file.originalname,
        size: file.size.toString(),
        mimeType: file.mimetype,
        filename: file.filename,
        originalName: file.originalname,
        buffer: file.buffer,
        fieldName: file.fieldname,
      },
    });
  }
  @Post('upload/multiple')
  @ApiOperation({
    summary: 'Upload multiple files',
    deprecated: true,
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
    deprecated: true,
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
