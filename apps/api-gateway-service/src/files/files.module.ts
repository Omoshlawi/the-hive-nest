import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { S3Module } from '../s3/s3.module';

@Module({
  controllers: [FilesController],
  imports: [S3Module],
})
export class FilesModule {}
