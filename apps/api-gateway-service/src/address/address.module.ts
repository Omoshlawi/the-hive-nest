import { Module } from '@nestjs/common';
import { AddressController } from './address.controller';
import { HiveServiceModule } from '@hive/registry';
import { HiveReferencesServiceClient } from '@hive/reference';

@Module({
  imports: [HiveServiceModule.forFeature([HiveReferencesServiceClient])],
  controllers: [AddressController],
})
export class AddressModule {}
