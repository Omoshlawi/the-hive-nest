import { Test, TestingModule } from '@nestjs/testing';
import { AttributeTypesService } from './attribute-types.service';

describe('AttributeTypesService', () => {
  let service: AttributeTypesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AttributeTypesService],
    }).compile();

    service = module.get<AttributeTypesService>(AttributeTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
