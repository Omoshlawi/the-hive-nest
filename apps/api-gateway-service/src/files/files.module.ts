import { HiveFileServiceClient } from '@hive/files';
import { HiveServiceModule } from '@hive/registry';
import { Module } from '@nestjs/common';
import { S3Module } from '../s3/s3.module';
import { FileUsageRuleController } from './file-usage-rule.controller';
import { FileUsageScopeController } from './file-usage-scope.controller';
import { FilesController } from './files.controller';

@Module({
  controllers: [
    FilesController,
    FileUsageRuleController,
    FileUsageScopeController,
  ],
  imports: [S3Module, HiveServiceModule.forFeature([HiveFileServiceClient])],
})
export class FilesModule {}
