import { Test, TestingModule } from '@nestjs/testing';
import { TourSceneService } from './tour-scene.service';

describe('TourSceneService', () => {
  let service: TourSceneService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TourSceneService],
    }).compile();

    service = module.get<TourSceneService>(TourSceneService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
