import { Test, TestingModule } from '@nestjs/testing';
import { ITourController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: ITourController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ITourController],
      providers: [AppService],
    }).compile();

    appController = app.get<ITourController>(ITourController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
