import { HiveServiceModule } from '@hive/registry';
import { Module } from '@nestjs/common';
import { HivePropertyServiceClient } from '@hive/property';
import { AmenitiesController } from './amenities.controller';
@Module({
  imports: [HiveServiceModule.forFeature([HivePropertyServiceClient])],
  providers: [],
  controllers: [AmenitiesController],
})
export class AmenitiesModule {}
