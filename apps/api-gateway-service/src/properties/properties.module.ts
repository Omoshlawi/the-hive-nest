import { Module } from '@nestjs/common';
import { PropertiesController } from './properties.controller';
import { HiveServiceModule } from '@hive/registry';
import { HivePropertyServiceClient } from '@hive/property';
import { PropertyMediaController } from './property-media.controller';
import { PropertyAmenityController } from './property-amenities.controller';
import { PropertyCategoryController } from './property-categories.controller';
import { PropertyAttributeController } from './property-attributes.controller';
import { PropertyRelationshipController } from './property-relationships.controller';
import { PropertyStatusHistoryController } from './property-status.controller';

@Module({
  imports: [HiveServiceModule.forFeature([HivePropertyServiceClient])],
  controllers: [
    PropertiesController,
    PropertyMediaController,
    PropertyAmenityController,
    PropertyCategoryController,
    PropertyAttributeController,
    PropertyRelationshipController,
    PropertyStatusHistoryController,
  ],
})
export class PropertiesModule {}
