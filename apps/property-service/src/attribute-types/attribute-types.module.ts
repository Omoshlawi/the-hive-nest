import { Module } from '@nestjs/common';
import { AttributeTypesController } from './attribute-types.controller';
import { AttributeTypesService } from './attribute-types.service';

@Module({
  controllers: [AttributeTypesController],
  providers: [AttributeTypesService]
})
export class AttributeTypesModule {}
