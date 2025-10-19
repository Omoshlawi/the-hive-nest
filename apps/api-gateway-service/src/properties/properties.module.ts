import { Module } from '@nestjs/common';
import { PropertiesController } from './properties.controller';
import { HiveServiceModule } from '@hive/registry';
import { HivePropertyServiceClient } from '@hive/property';

@Module({
  imports: [HiveServiceModule.forFeature([HivePropertyServiceClient])],
  controllers: [PropertiesController],
})
export class PropertiesModule {}
