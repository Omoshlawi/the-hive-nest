import { Module } from '@nestjs/common';
import { ServiceRegistryController } from './service-registry.controller';
import { ServiceRegistryService } from './service-registry.service';
import { MemoryStorage } from '@hive/registry';
@Module({
  controllers: [ServiceRegistryController],
  providers: [ServiceRegistryService, MemoryStorage],
})
export class ServiceRegistryModule {}
