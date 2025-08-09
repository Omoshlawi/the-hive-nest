export enum StorageStrategy {
  MEMORY_STORAGE = 'memory',
  REDIS_STORAGE = 'redis',
}

export interface StorageConfigOptions {
  strategy: StorageStrategy;
}
