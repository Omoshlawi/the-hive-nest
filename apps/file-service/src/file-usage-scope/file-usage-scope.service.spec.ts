import { Test, TestingModule } from '@nestjs/testing';
import { FileUsageScopeService } from './file-usage-scope.service';

describe('FileUsageScopeService', () => {
  let service: FileUsageScopeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileUsageScopeService],
    }).compile();

    service = module.get<FileUsageScopeService>(FileUsageScopeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
