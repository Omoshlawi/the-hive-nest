import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { S3Module } from '../s3/s3.module';
import { HiveServiceModule } from '@hive/registry';
import { HiveFileServiceClient } from '@hive/files';

@Module({
  controllers: [FilesController],
  imports: [S3Module, HiveServiceModule.forFeature([HiveFileServiceClient])],
})
export class FilesModule {}
