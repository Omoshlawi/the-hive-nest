import { Test, TestingModule } from '@nestjs/testing';
import { TourController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: TourController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [TourController],
      providers: [AppService],
    }).compile();

    appController = app.get<TourController>(TourController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
