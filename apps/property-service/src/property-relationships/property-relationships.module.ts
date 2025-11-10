import { Module } from '@nestjs/common';
import { PropertyRelationshipsController } from './property-relationships.controller';
import { PropertyRelationshipsService } from './property-relationships.service';

@Module({
  controllers: [PropertyRelationshipsController],
  providers: [PropertyRelationshipsService]
})
export class PropertyRelationshipsModule {}
