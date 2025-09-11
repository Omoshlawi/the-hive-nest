import { Module } from '@nestjs/common';
import { FileUsageRuleController } from './file-usage-rule.controller';
import { FileUsageRuleService } from './file-usage-rule.service';

@Module({
  controllers: [FileUsageRuleController],
  providers: [FileUsageRuleService]
})
export class FileUsageRuleModule {}
