import { HiveFileServiceClient } from '@hive/files';
import { HiveServiceModule } from '@hive/registry';
import { Module } from '@nestjs/common';
import { FileUsageRuleController } from './file-usage-rule.controller';
import { FileUsageScopeController } from './file-usage-scope.controller';
import { FilesController } from './files.controller';

@Module({
  controllers: [
    // NB: FileUsageRuleController AND FileUsageScopeController must be registered before FilesController for
    // priritization of routes in them before routes in FilesController since they share /files base url causing
    // conflic when getting file (/files/some-uuid) and (/files/usage-rules) and (/files/usage-scope)
    FileUsageRuleController,
    FileUsageScopeController,
    FilesController,
  ],
  imports: [ HiveServiceModule.forFeature([HiveFileServiceClient])],
})
export class FilesModule {}
