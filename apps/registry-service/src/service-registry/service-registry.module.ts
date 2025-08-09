import { Module } from '@nestjs/common';
import { StorageModule } from 'src/storage/storage.module';
import { ServiceRegistryController } from './service-registry.controller';
import { ServiceRegistryService } from './service-registry.service';
@Module({
  imports: [StorageModule.register()],
  controllers: [ServiceRegistryController],
  providers: [ServiceRegistryService],
})
export class ServiceRegistryModule {}
