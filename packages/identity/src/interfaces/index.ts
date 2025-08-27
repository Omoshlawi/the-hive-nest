import {
  QueryServicesRequest,
  RegistryClientModuleOptions,
} from '@hive/registry';

export interface ClientServiceConfig {
  service: QueryServicesRequest;
}

export interface IdentityClientModuleOptions
  extends Pick<
    RegistryClientModuleOptions,
    'imports' | 'inject' | 'isGlobal' | 'providers'
  > {
  useFactory: (
    ...args: any[]
  ) => Promise<ClientServiceConfig> | ClientServiceConfig;
}
