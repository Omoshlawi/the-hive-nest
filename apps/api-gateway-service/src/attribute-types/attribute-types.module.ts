import { Module } from '@nestjs/common';
import { AttributeTypesController } from './attribute-types.controller';
import { HiveServiceModule } from '@hive/registry';
import { HivePropertyServiceClient } from '@hive/property';

@Module({
  imports: [
    HiveServiceModule.forRoot({
      enableHeartbeat: false,
      services: [HivePropertyServiceClient],
    }),
  ],
  controllers: [AttributeTypesController],
})
export class AttributeTypesModule {}
