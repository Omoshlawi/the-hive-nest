import { Test, TestingModule } from '@nestjs/testing';
import { PropertyRelationshipsController } from './property-relationships.controller';

describe('PropertyRelationshipsController', () => {
  let controller: PropertyRelationshipsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropertyRelationshipsController],
    }).compile();

    controller = module.get<PropertyRelationshipsController>(PropertyRelationshipsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
