/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { DynamicModule, Module, Provider, Type } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RegistryClientConfig } from '../config';
import {
  CLIENT_SERVICE_CONFIG_TOKEN,
  HIVE_SERVICE_METADATA_TOKEN,
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

/**
 * Central NestJS module for service registration, discovery, and gRPC client
 * injection. Provides two entry points:
 *
 * **`forRoot(options)`** — call once in your service's `AppModule`.
 *   - Connects to `registry-service` via gRPC.
 *   - Registers this service and starts the heartbeat (when `enableHeartbeat: true`).
 *   - Requires `ScheduleModule.forRoot()` in the same AppModule for heartbeats to fire.
 *   - Only one `forRoot` call per process.
 *
 * **`forFeature(services)`** — call in individual feature modules of the
 *   API Gateway to inject typed gRPC client stubs (e.g. `HivePropertyServiceClient`).
 *   - Relies on `forRoot` having been called in the root module.
 *   - Each service class must be decorated with `@HiveService(config)`.
 *
 * @example
 * // Domain service AppModule — registers with registry and sends heartbeats
 * HiveServiceModule.forRoot({ enableHeartbeat: true, client: { ... } })
 *
 * // API Gateway feature module — injects the property service gRPC client
 * HiveServiceModule.forFeature([HivePropertyServiceClient])
 */
@Module({})
export class HiveServiceModule {
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
   * Standalone variant of `forFeature` that also sets up the registry
   * connection. Use this when you need a client in a module that does not
   * have a parent `forRoot` in scope (e.g. standalone tests or micro-apps).
   * Prefer `forFeature` in normal gateway feature modules.
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
          HIVE_SERVICE_METADATA_TOKEN,
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
