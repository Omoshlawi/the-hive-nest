import { Module, DynamicModule, Provider, Type } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { RegistryClientService } from './registry-client.service';
import { HiveServiceFactory } from './hive-service-client.factory.service';
import { HIVE_SERVICE_METADATA_KEY } from '../constants';
import { HiveServiceClient } from './hive-service-client.service';

export interface HiveServiceModuleOptions {
  services?: Type<any>[];
  global?: boolean;
}

@Module({})
export class HiveServiceModule {
  static forRoot(options: HiveServiceModuleOptions = {}): DynamicModule {
    const providers: Provider[] = [RegistryClientService, HiveServiceFactory];

    // Add service-specific providers
    if (options.services) {
      for (const serviceClass of options.services) {
        const config = Reflect.getMetadata(
          HIVE_SERVICE_METADATA_KEY,
          serviceClass,
        );
        if (!config) {
          throw new Error(
            `Service ${serviceClass.name} is not decorated with @HiveService`,
          );
        }

        // Create a provider for HiveServiceClient with specific config
        providers.push({
          provide: `${serviceClass.name}_CLIENT`,
          useFactory: (registryClient: RegistryClientService) => {
            return new HiveServiceClient(config, registryClient);
          },
          inject: [RegistryClientService],
        });

        // Add the service class itself
        providers.push(serviceClass);
      }
    }

    return {
      module: HiveServiceModule,
      imports: [DiscoveryModule],
      providers,
      exports: [
        RegistryClientService,
        HiveServiceFactory,
        ...(options.services || []),
      ],
      global: options.global,
    };
  }

  static forFeature(services: Type<any>[]): DynamicModule {
    return this.forRoot({ services });
  }
}
