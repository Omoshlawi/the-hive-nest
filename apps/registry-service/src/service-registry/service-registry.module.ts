import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { ServiceRegistryController } from './service-registry.controller';
import { ServiceRegistryService } from './service-registry.service';
import { StorageStrategy } from '../storage/storage.interfaces';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    StorageModule.register({ strategy: StorageStrategy.REDIS_STORAGE }),
    ScheduleModule.forRoot(),
  ],
  controllers: [ServiceRegistryController],
  providers: [ServiceRegistryService],
})
export class ServiceRegistryModule {}
