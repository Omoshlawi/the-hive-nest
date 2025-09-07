import { CustomRepresentationQueryDto } from '@hive/common';
import {
  UploadFilesDto,
  UploadMutipleFilesDto,
  UploadSingleFileDto,
} from '@hive/files';
import {
  Body,
  Controller,
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

@Controller('files')
export class FilesController {
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    description: 'Upload single file',
  })
  @Post('upload/single')
  uploadSingleFile(
    @UploadedFile('file') file: Express.Multer.File,
    @Query() query: CustomRepresentationQueryDto,
    @Body() uploadFileDto: UploadSingleFileDto,
  ) {
    console.log(file);
    console.log(uploadFileDto);
  }
  @Post('upload/multiple')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files'))
  uploadMultipleFile(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Query() query: CustomRepresentationQueryDto,
    @Body() uploadFileDto: UploadMutipleFilesDto,
  ) {
    console.log(files);
    console.log(uploadFileDto);
  }
  @Post('upload/multiple/fields')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  uploadFiles(
    @UploadedFiles() file: Array<Express.Multer.File>,
    @Query() query: CustomRepresentationQueryDto,
    @Body() uploadFileDto: UploadFilesDto,
  ) {
    console.log(file);
    console.log(uploadFileDto);
  }
}
