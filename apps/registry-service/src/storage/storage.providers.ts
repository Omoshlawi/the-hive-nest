import { BaseStorage, MemoryStorage } from '@hive/registry';
import { Provider } from '@nestjs/common';
import { AppConfig } from '../config/app.config';
import { RedisService } from './redis.service';
import { STORAGE_CONFIG_OPTIONS } from './storage.constants';
import { StorageConfigOptions, StorageStrategy } from './storage.interfaces';
import { RedisStorage } from './storage.redis.service';

export const StorageProviders: Array<Provider> = [
  RedisService,
  MemoryStorage,
  RedisStorage,
  {
    provide: BaseStorage,
    useFactory: (
      options: StorageConfigOptions,
      config: AppConfig,
      memoryStorage: MemoryStorage,
      redisStorage: RedisStorage,
    ) => {
      const strategy = options?.strategy || config.storageStategy;

      switch (strategy) {
        case StorageStrategy.MEMORY_STORAGE:
          return memoryStorage;
        case StorageStrategy.REDIS_STORAGE:
          return redisStorage;
        default:
          throw new Error('Storage Not configured.');
      }
    },
    inject: [STORAGE_CONFIG_OPTIONS, AppConfig, MemoryStorage, RedisStorage],
  },
];
