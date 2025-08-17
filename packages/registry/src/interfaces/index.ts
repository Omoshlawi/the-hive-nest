import { ModuleMetadata, Type } from '@nestjs/common';
import { RegisterServiceRequest } from '../types';

export * from './storage.interface';

export interface ClientServiceConfig {
  service: RegisterServiceRequest;
}

export interface RegistryClientModuleOptions
  extends Pick<ModuleMetadata, 'providers' | 'imports'> {
  useFactory: (
    ...args: any[]
  ) => Promise<ClientServiceConfig> | ClientServiceConfig;
  inject?: any[];
  isGlobal?: boolean;
}

export interface RegistryClientModuleAsyncOptions
  extends Pick<ModuleMetadata, 'providers' | 'imports'> {
  useFactory?: (...args: any[]) => Promise<any> | any;
  inject?: any[];
  useClass?: Type<any>;
  useExisting?: string | symbol | Type<any>;
  isGlobal?: boolean;
}
