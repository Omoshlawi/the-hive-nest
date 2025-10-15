import { Test, TestingModule } from '@nestjs/testing';
import { IdentifierSequenceController } from './identifier-sequence.controller';

describe('IdentifierSequenceController', () => {
  let controller: IdentifierSequenceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IdentifierSequenceController],
    }).compile();

    controller = module.get<IdentifierSequenceController>(IdentifierSequenceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
