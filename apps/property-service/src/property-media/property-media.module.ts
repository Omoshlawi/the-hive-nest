import { Module } from '@nestjs/common';
import { PropertyMediaService } from './property-media.service';
import { PropertyMediaController } from './property-media.controller';

@Module({
  providers: [PropertyMediaService],
  controllers: [PropertyMediaController]
})
export class PropertyMediaModule {}
