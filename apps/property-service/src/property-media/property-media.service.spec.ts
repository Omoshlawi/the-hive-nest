import { Test, TestingModule } from '@nestjs/testing';
import { PropertyMediaService } from './property-media.service';

describe('PropertyMediaService', () => {
  let service: PropertyMediaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PropertyMediaService],
    }).compile();

    service = module.get<PropertyMediaService>(PropertyMediaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
