import { Test, TestingModule } from '@nestjs/testing';
import { FileUsageRuleService } from './file-usage-rule.service';

describe('FileUsageRuleService', () => {
  let service: FileUsageRuleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileUsageRuleService],
    }).compile();

    service = module.get<FileUsageRuleService>(FileUsageRuleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
