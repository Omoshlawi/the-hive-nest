import { Configuration, Value } from '@itgorillaz/configify';
import z from 'zod';
import {} from '@hive/registry';
import { StorageStrategy } from 'src/storage/storage.interfaces';

@Configuration()
export class AppConfig {
  @Value('PORT', { parse: z.coerce.number().parse, default: 4001 })
  port: number;
  @Value('STORAGE_STRATEGY', { default: 'redis' })
  storageStategy: StorageStrategy
  @Value('REDIS_DB_URL')
  redisDbUrl: string;
}
