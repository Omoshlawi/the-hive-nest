// storage.providers.ts
// This separates the providers into a different file for clarity and maintainability.
import { BaseStorage, MemoryStorage } from '@hive/registry';
import { STORAGE_CONFIG_OPTIONS } from './storage.constants';
import { StorageConfigOptions, StorageStrategy } from './storage.interfaces';
import { AppConfig } from '../config/app.config';
import { Provider } from '@nestjs/common';

export const StorageProviders: Array<Provider> = [
  // Provide all possible storage implementations
  MemoryStorage,
  // TODO: Add RedisStorage when implemented
  // RedisStorage,
  {
    provide: BaseStorage,
    useFactory: (
      options: StorageConfigOptions,
      config: AppConfig,
      memoryStorage: MemoryStorage,
    ) => {
      const strategy = options?.strategy || config.storageStategy;

      switch (strategy) {
        case StorageStrategy.MEMORY_STORAGE:
          return memoryStorage; // Directly provide the concrete implementation
        case StorageStrategy.REDIS_STORAGE:
          // TODO: Return new RedisStorage() after implementing it
          throw new Error('Redis Storage not yet implemented.');
        default:
          throw new Error('Storage Not configured.');
      }
    },
    // The inject array should only contain the dependencies needed by the factory.
    // The factory will then return the correct implementation.
    inject: [STORAGE_CONFIG_OPTIONS, AppConfig, MemoryStorage],
  },
];
