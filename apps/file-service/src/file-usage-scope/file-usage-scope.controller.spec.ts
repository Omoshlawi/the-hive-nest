import { Test, TestingModule } from '@nestjs/testing';
import { FileUsageScopeController } from './file-usage-scope.controller';

describe('FileUsageScopeController', () => {
  let controller: FileUsageScopeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileUsageScopeController],
    }).compile();

    controller = module.get<FileUsageScopeController>(FileUsageScopeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
