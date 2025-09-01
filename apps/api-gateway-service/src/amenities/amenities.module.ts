import { HiveServiceModule } from '@hive/registry';
import { Module } from '@nestjs/common';
import { HiveProperyServiceClient } from '@hive/property';
import { AmenitiesController } from './amenities.controller';
@Module({
  imports: [
    HiveServiceModule.forRoot({
      enableHeartbeat: false,
      services: [HiveProperyServiceClient],
    }),
  ],
  providers: [],
  controllers: [AmenitiesController],
})
export class AmenitiesModule {}
