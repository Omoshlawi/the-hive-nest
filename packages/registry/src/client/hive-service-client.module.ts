import { DynamicModule, Module, Provider, Type } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RegistryClientConfig } from '../config';
import {
  CLIENT_SERVICE_CONFIG_TOKEN,
  HIVE_SERVICE_METADATA_KEY,
  REGISTRY_PACKAGE,
} from '../constants';
import {
  HiveServiceConfig,
  RegistryClientModuleAsyncOptions,
  RegistryClientModuleOptions,
} from '../interfaces';
import { HiveServiceClient } from './hive-service-client.service';
import { RegistryClientService } from './registry-client.service';

export interface HiveServiceModuleOptions {
  services?: Type<any>[];
  global?: boolean;
  client?: RegistryClientModuleOptions;
}

@Module({})
export class HiveServiceModule {
  static forRoot(options: HiveServiceModuleOptions = {}): DynamicModule {
    const providers: Provider[] = [
      ...(options.client?.providers ?? []),
      RegistryClientService,
      this.createAsyncProvider(options.client),
      Reflector,
    ];

    // Add service-specific providers
    if (options.services) {
      for (const serviceClass of options.services) {
        providers.push({
          provide: serviceClass,
          useFactory: (
            registryClient: RegistryClientService,
            reflector: Reflector,
          ) => {
            const config = reflector.get<HiveServiceConfig>(
              HIVE_SERVICE_METADATA_KEY,
              serviceClass,
            );
            if (!config) {
              throw new Error(
                `Service ${serviceClass.name} is not decorated with @HiveService`,
              );
            }
            const client = new HiveServiceClient(config, registryClient);
            return new serviceClass(client);
          },
          inject: [RegistryClientService, Reflector],
        });
      }
    }

    return {
      module: HiveServiceModule,
      imports: [
        ...(options.client?.imports ?? []),
        ClientsModule.registerAsync([
          {
            name: REGISTRY_PACKAGE.V1.TOKEN,
            useFactory: (config: RegistryClientConfig) => {
              if (!config?.serverUrl) {
                throw new Error('Registry server URL is required');
              }

              return {
                transport: Transport.GRPC,
                options: {
                  package: REGISTRY_PACKAGE.V1.NAME,
                  protoPath: REGISTRY_PACKAGE.V1.PROTO_PATH,
                  url: config.serverUrl,
                  // ADDITIONAL OPTIONS FOR ROBUSTNESS
                  // loader: {
                  //   keepCase: true,
                  //   longs: String,
                  //   enums: String,
                  //   defaults: true,
                  //   oneofs: true,
                  // },
                  // //  RETRY LOGIC
                  // maxSendMessageLength: 4 * 1024 * 1024, // 4MB
                  // maxReceiveMessageLength: 4 * 1024 * 1024, // 4MB
                },
              };
            },
            inject: [RegistryClientConfig],
            imports: options.client?.imports ?? [],
          },
        ]),
      ],
      providers,
      exports: [
        RegistryClientService,
        ...(options.services || []),
        CLIENT_SERVICE_CONFIG_TOKEN,
      ],
      global: options.global,
    };
  }

  private static createAsyncProvider(
    options?: RegistryClientModuleAsyncOptions,
  ): Provider {
    if (options?.useFactory) {
      return {
        provide: CLIENT_SERVICE_CONFIG_TOKEN,
        useFactory: options.useFactory,
        inject: options.inject ?? [],
      };
    }

    if (options?.useClass) {
      return {
        provide: CLIENT_SERVICE_CONFIG_TOKEN,
        useClass: options.useClass,
      };
    }

    if (options?.useExisting) {
      return {
        provide: CLIENT_SERVICE_CONFIG_TOKEN,
        useExisting: options.useExisting,
      };
    }

    throw new Error(
      'Invalid async configuration. Must provide useFactory, useClass, or useExisting.',
    );
  }
}
