import { Test, TestingModule } from '@nestjs/testing';
import { RelationshipTypesService } from './relationship-types.service';

describe('RelationshipTypesService', () => {
  let service: RelationshipTypesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RelationshipTypesService],
    }).compile();

    service = module.get<RelationshipTypesService>(RelationshipTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
