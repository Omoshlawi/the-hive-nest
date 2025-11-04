import { Test, TestingModule } from '@nestjs/testing';
import { TourSceneController } from './tour-scene.controller';

describe('TourSceneController', () => {
  let controller: TourSceneController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TourSceneController],
    }).compile();

    controller = module.get<TourSceneController>(TourSceneController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
