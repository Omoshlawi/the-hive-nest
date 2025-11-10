import { Test, TestingModule } from '@nestjs/testing';
import { PropertyRelationshipsService } from './property-relationships.service';

describe('PropertyRelationshipsService', () => {
  let service: PropertyRelationshipsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PropertyRelationshipsService],
    }).compile();

    service = module.get<PropertyRelationshipsService>(PropertyRelationshipsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
