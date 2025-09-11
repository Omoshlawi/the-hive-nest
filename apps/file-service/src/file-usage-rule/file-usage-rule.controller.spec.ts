import { Test, TestingModule } from '@nestjs/testing';
import { FileUsageRuleController } from './file-usage-rule.controller';

describe('FileUsageRuleController', () => {
  let controller: FileUsageRuleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileUsageRuleController],
    }).compile();

    controller = module.get<FileUsageRuleController>(FileUsageRuleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
