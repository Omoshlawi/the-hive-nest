import { Test, TestingModule } from '@nestjs/testing';
import { IdentifierSequenceService } from './identifier-sequence.service';

describe('IdentifierSequenceService', () => {
  let service: IdentifierSequenceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IdentifierSequenceService],
    }).compile();

    service = module.get<IdentifierSequenceService>(IdentifierSequenceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
