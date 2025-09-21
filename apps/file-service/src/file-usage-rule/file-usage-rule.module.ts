import { Module } from '@nestjs/common';
import { FileUsageRuleController } from './file-usage-rule.controller';
import { FileUsageRuleService } from './file-usage-rule.service';
import { FileUsageAuthzService } from '@hive/files';

@Module({
  controllers: [FileUsageRuleController],
  providers: [FileUsageRuleService, FileUsageAuthzService,
  ]
})
export class FileUsageRuleModule {}
