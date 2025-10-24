import { Module } from '@nestjs/common';
import { AddressHierarchyController } from './address-hierarchy.controller';
import { HiveServiceModule } from '@hive/registry';
import { HiveReferencesServiceClient } from '@hive/reference';

@Module({
  imports: [HiveServiceModule.forFeature([HiveReferencesServiceClient])],
  controllers: [AddressHierarchyController],
})
export class AddressHierarchyModule {}
