import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RegistryClientConfig } from '../config';
import { CLIENT_SERVICE_CONFIG_TOKEN, REGISTRY_PACKAGE } from '../constants';
import {
  RegistryClientModuleOptions,
  RegistryClientModuleAsyncOptions,
} from '../interfaces';
import { RegistryClientService } from './registry-client.service';

@Module({})
export class RegistryClientModule {
  static registerForService(
    options: RegistryClientModuleOptions,
  ): DynamicModule {
    const providers: Provider[] = [
      ...(options.providers ?? []),
      {
        provide: CLIENT_SERVICE_CONFIG_TOKEN,
        useFactory: options.useFactory,
        inject: options.inject ?? [],
      },
      RegistryClientService,
    ];

    return {
      global: options?.isGlobal,
      module: RegistryClientModule,
      imports: [
        ...(options.imports ?? []),
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
            imports: options.imports ?? [],
          },
        ]),
      ],
      providers,
      exports: [RegistryClientService, CLIENT_SERVICE_CONFIG_TOKEN],
    };
  }

  static registerForServiceAsync(
    options: RegistryClientModuleAsyncOptions,
  ): DynamicModule {
    const asyncProviders = this.createAsyncProviders(options);

    return {
      global: options?.isGlobal,
      module: RegistryClientModule,
      imports: [
        ...(options.imports ?? []),
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
                  // loader: {
                  //   keepCase: true,
                  //   longs: String,
                  //   enums: String,
                  //   defaults: true,
                  //   oneofs: true,
                  // },
                },
              };
            },
            inject: [RegistryClientConfig],
            imports: options.imports ?? [],
          },
        ]),
      ],
      providers: [
        ...(options.providers ?? []),
        ...asyncProviders,
        RegistryClientService,
      ],
      exports: [RegistryClientService, CLIENT_SERVICE_CONFIG_TOKEN],
    };
  }

  private static createAsyncProviders(
    options: RegistryClientModuleAsyncOptions,
  ): Provider[] {
    if (options.useFactory) {
      return [
        {
          provide: CLIENT_SERVICE_CONFIG_TOKEN,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
      ];
    }

    if (options.useClass) {
      return [
        {
          provide: CLIENT_SERVICE_CONFIG_TOKEN,
          useClass: options.useClass,
        },
      ];
    }

    if (options.useExisting) {
      return [
        {
          provide: CLIENT_SERVICE_CONFIG_TOKEN,
          useExisting: options.useExisting,
        },
      ];
    }

    throw new Error(
      'Invalid async configuration. Must provide useFactory, useClass, or useExisting.',
    );
  }
}
