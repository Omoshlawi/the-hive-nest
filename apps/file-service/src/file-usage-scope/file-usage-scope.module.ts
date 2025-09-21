import { Module } from '@nestjs/common';
import { FileUsageScopeController } from './file-usage-scope.controller';
import { FileUsageScopeService } from './file-usage-scope.service';
import { FileUsageAuthzService } from '@hive/files';

@Module({
  controllers: [FileUsageScopeController],
  providers: [FileUsageScopeService, FileUsageAuthzService],
})
export class FileUsageScopeModule {}
