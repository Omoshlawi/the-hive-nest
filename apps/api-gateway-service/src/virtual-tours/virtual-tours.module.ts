import { HiveServiceModule } from '@hive/registry';
import { HiveVirtualToursServiceClient } from '@hive/virtual-tour';
import { Module } from '@nestjs/common';
import { VirtualToursController } from './virtual-tours.controller';

@Module({
  controllers: [VirtualToursController],
  imports: [HiveServiceModule.forFeature([HiveVirtualToursServiceClient])],
})
export class VirtualToursModule {}
