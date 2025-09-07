import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  AnyFilesInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';

@Controller('files')
export class FilesController {
  @Post('upload/single')
  @UseInterceptors(FileInterceptor('file'))
  uploadSingleFile(@UploadedFile() file: Express.Multer.File) {
    console.log(file);
  }
  @Post('upload/multiple')
  @UseInterceptors(FilesInterceptor('files'))
  uploadMultipleFile(@UploadedFile() file: Express.Multer.File) {
    console.log(file);
  }
  @Post('upload/fields')
  @UseInterceptors(AnyFilesInterceptor())
  uploadFieldsFile(@UploadedFile() file: Express.Multer.File) {
    console.log(file);
  }
}
