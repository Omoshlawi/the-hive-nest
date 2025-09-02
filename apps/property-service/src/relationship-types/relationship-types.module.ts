import { Module } from '@nestjs/common';
import { RelationshipTypesController } from './relationship-types.controller';
import { RelationshipTypesService } from './relationship-types.service';

@Module({
  controllers: [RelationshipTypesController],
  providers: [RelationshipTypesService]
})
export class RelationshipTypesModule {}
