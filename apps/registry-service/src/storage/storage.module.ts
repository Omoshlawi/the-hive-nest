import { DynamicModule, Module } from '@nestjs/common';
import { StorageConfigOptions } from './storage.interfaces';
import { STORAGE_CONFIG_OPTIONS } from './storage.constants';
import { StorageProviders } from './storage.providers';
import { BaseStorage } from '@hive/registry';

@Module({})
export class StorageModule {
  static register(options?: StorageConfigOptions): DynamicModule {
    return {
      module: StorageModule,
      providers: [
        ...StorageProviders,
        {
          provide: STORAGE_CONFIG_OPTIONS,
          useValue: options,
        },
      ],
      exports: [BaseStorage],
    };
  }
}
