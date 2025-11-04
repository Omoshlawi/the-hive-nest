import { Module } from '@nestjs/common';
import { TourSceneController } from './tour-scene.controller';
import { TourSceneService } from './tour-scene.service';

@Module({
  controllers: [TourSceneController],
  providers: [TourSceneService],
})
export class TourSceneModule {}
