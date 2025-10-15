/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { DynamicModule, Module, Provider, Type } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RegistryClientConfig } from '../config';
import {
  CLIENT_SERVICE_CONFIG_TOKEN,
  HIVE_SERVICE_METADATA_KEY,
  REGISTRY_PACKAGE,
} from '../constants';
import { HiveServiceConfig, RegistryClientAsyncOptions } from '../interfaces';
import { HiveServiceClient } from './hive-service-client.service';
import { HiveDiscoveryService } from './hive-discovery.service';
import { HiveHeartbeatService } from './hive-heartbeat.service';

export interface HiveServiceModuleOptions {
  services?: Type<any>[];
  global?: boolean;
  client?: RegistryClientAsyncOptions;
  enableHeartbeat?: boolean;
}

// TODO: 
// document that for heartbeat to work, you must import ScheduleModule in the consumer module
// one service can only have one heartbeat service
// Make global using for root (in root module) to share HiveDiscovery service and other service to the forFeature
@Module({})
export class HiveServiceModule {
  /**
   * RECOMMENDED: Use this ONLY in AppModule
   * Choose whether to include heartbeat functionality or not
   */
  static forRoot(options: HiveServiceModuleOptions): DynamicModule {
    if (options.enableHeartbeat && !options.client) {
      throw new Error(
        'Client configuration is required when heartbeat is enabled',
      );
    }
    const RegistryProxyModule = this.createRegistryClientProxy(options);
    const providers: Provider[] = [
      ...(options.client?.providers ?? []),
      HiveDiscoveryService,
      ...(options.client
        ? [this.createAsyncConfigProvider(options.client)]
        : []),
      Reflector,
      ...this.serviceSpecificProviders(options.services),
      ...(options.enableHeartbeat ? [HiveHeartbeatService] : []),
    ];

    return {
      module: HiveServiceModule,
      imports: [...(options.client?.imports ?? []), RegistryProxyModule],
      providers,
      exports: [
        HiveDiscoveryService,
        ...(options.services ?? []),
        ...(options.client ? [CLIENT_SERVICE_CONFIG_TOKEN] : []),
        ...(options.enableHeartbeat ? [HiveHeartbeatService] : []),
      ],
      global: options.global,
    };
  }

  /**
   * Relies on forRoot called and app(root) module
   * ✅ RECOMMENDED: Use this in feature modules
   * Creates service clients that use the singleton RegistryClientService
   */
  static forFeatureStandAlone(services: Array<Type<any>>): DynamicModule {
    if (!services || services.length === 0) {
      throw new Error('At least one service must be provided to forFeature()');
    }
    return this.forRoot({ services });
  }
  static forFeature(services: Array<Type<any>>): DynamicModule {
    return {
      module: HiveServiceModule,
      providers: [Reflector, ...this.serviceSpecificProviders(services)],
      exports: services,
    };
  }

  private static serviceSpecificProviders(
    services: Array<Type<any>> = [],
  ): Array<Provider> {
    return services.map((serviceClass) => ({
      provide: serviceClass,
      useFactory: (
        discoveryService: HiveDiscoveryService,
        reflector: Reflector,
        registryConfig: RegistryClientConfig,
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

        // Life cycle methods are initiated in consuming service client instances for efficiency
        const client = new HiveServiceClient(
          {
            ...config,
            version: config.version ?? registryConfig.serviceVersion,
          },
          discoveryService,
        );

        return new serviceClass(client);
      },
      inject: [HiveDiscoveryService, Reflector, RegistryClientConfig],
    }));
  }

  private static createRegistryClientProxy(options: HiveServiceModuleOptions) {
    return ClientsModule.registerAsync([
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
    ]);
  }

  private static createAsyncConfigProvider(
    options?: RegistryClientAsyncOptions,
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
