import { Module } from '@nestjs/common';
import { FileUsageScopeController } from './file-usage-scope.controller';
import { FileUsageScopeService } from './file-usage-scope.service';

@Module({
  controllers: [FileUsageScopeController],
  providers: [FileUsageScopeService]
})
export class FileUsageScopeModule {}
