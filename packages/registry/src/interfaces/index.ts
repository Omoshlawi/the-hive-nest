import { ModuleMetadata, Type } from '@nestjs/common';
import { RegisterServiceRequest, ServiceRegistration } from '../types';

export * from './storage.interface';
export * from './base-hive-service';
export type HiveServiceConfig = Partial<ServiceRegistration> & {
  package: string;
  protoPath: string;
  /**
   * GRPC Service name
   */
  serviceName: string;
};
export interface ClientServiceConfig {
  service: RegisterServiceRequest;
}

export interface RegistryClientOptions
  extends Pick<ModuleMetadata, 'providers' | 'imports'> {
  useFactory: (
    ...args: any[]
  ) => Promise<ClientServiceConfig> | ClientServiceConfig;
  inject?: any[];
}

export interface RegistryClientAsyncOptions
  extends Pick<ModuleMetadata, 'providers' | 'imports'> {
  useFactory?: (...args: any[]) => Promise<any> | any;
  inject?: any[];
  useClass?: Type<any>;
  useExisting?: string | symbol | Type<any>;
}
