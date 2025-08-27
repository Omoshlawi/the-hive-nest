import { DynamicModule } from '@nestjs/common';
import { IdentityClientService } from './identity-client.service';
import {
  QueryServicesRequest,
  RegistryClientModuleOptions,
} from '@hive/registry';
import { IDENTITY_SERVICE_CONFIG_TOKEN } from '../constants';
import { IdentityClientModuleOptions } from '../interfaces';

/**
 * Client module to interact with the Identity service via gRPC through RegistryClient for discovery.
 * Must be imported in module that also imports RegistryClientModule
 * Is dependent on RegistryClientModule for discovery of identity service server/endpoint
 * The IdentityClientService injects provider RegistryClientService from module RegistryClientModule for discovery
 */
export class IdentityClientModule {
  /**
   * Client module to interact with the Identity service via gRPC through RegistryClient for discovery.
   * Must be imported in module that also imports RegistryClientModule
   * Is dependent on RegistryClientModule for discovery of identity service server/endpoint
   * The IdentityClientService injects provider RegistryClientService from module RegistryClientModule for discovery
   */
  static register(options: IdentityClientModuleOptions): DynamicModule {
    return {
      global: options?.isGlobal,
      module: IdentityClientModule,
      imports: options.imports ?? [],
      providers: [
        ...(options.providers ?? []),
        {
          provide: IDENTITY_SERVICE_CONFIG_TOKEN,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        IdentityClientService,
      ],
      exports: [IdentityClientService, IDENTITY_SERVICE_CONFIG_TOKEN],
    };
  }
}
