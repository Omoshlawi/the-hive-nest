import { Module } from '@nestjs/common';
import { RelationshipTypesController } from './relationship-types.controller';
import { HiveServiceModule } from '@hive/registry';
import { HivePropertyServiceClient } from '@hive/property';

@Module({
  imports: [
    HiveServiceModule.forRoot({
      enableHeartbeat: false,
      services: [HivePropertyServiceClient],
    }),
  ],
  controllers: [RelationshipTypesController],
})
export class RelationshipTypesModule {}
