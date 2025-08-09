import { Module } from '@nestjs/common';
import { StorageModule } from 'src/storage/storage.module';
import { ServiceRegistryController } from './service-registry.controller';
import { ServiceRegistryService } from './service-registry.service';
import { StorageStrategy } from 'src/storage/storage.interfaces';

@Module({
  imports: [
    StorageModule.register({ strategy: StorageStrategy.REDIS_STORAGE }),
  ],
  controllers: [ServiceRegistryController],
  providers: [ServiceRegistryService],
})
export class ServiceRegistryModule {}
