import { Test, TestingModule } from '@nestjs/testing';
import { PropertyMediaController } from './property-media.controller';

describe('PropertyMediaController', () => {
  let controller: PropertyMediaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropertyMediaController],
    }).compile();

    controller = module.get<PropertyMediaController>(PropertyMediaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
