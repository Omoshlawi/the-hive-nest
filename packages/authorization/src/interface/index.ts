export * from './base-authorization-service';

import { ModuleMetadata, Type } from '@nestjs/common';
import {
  ClientConfiguration,
  UserClientConfigurationParams,
} from '@openfga/sdk';

export type OpenFGAConfig = ClientConfiguration | UserClientConfigurationParams;

export interface AuthorizatioModuleOptions
  extends Pick<ModuleMetadata, 'providers' | 'imports'> {
  useFactory?: (...args: any[]) => Promise<OpenFGAConfig> | OpenFGAConfig;
  inject?: any[];
  useClass?: Type<any>;
  useExisting?: string | symbol | Type<any>;
  global?: boolean;
}
