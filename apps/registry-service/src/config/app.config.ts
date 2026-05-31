/* eslint-disable @typescript-eslint/unbound-method */
import { Configuration, Value } from '@itgorillaz/configify';
import { StorageStrategy } from '../storage/storage.interfaces';
import z from 'zod';

@Configuration()
export class AppConfig {
  @Value('PORT', {
    parse: z.coerce.number({ error: 'Invalid PORT' }).parse,
    default: 4001,
  })
  port: number;
  @Value('STORAGE_STRATEGY', {
    default: StorageStrategy.REDIS_STORAGE,
    parse: z
      .enum(StorageStrategy, { error: 'Invalid STORAGE_STRATEGY' })
      .optional().parse,
  })
  storageStategy: StorageStrategy;
  @Value('REDIS_DB_URL', {
    parse: z.url({ error: 'Invalid REDIS_DB_URL' }).parse,
  })
  redisDbUrl: string;
  @Value('name')
  serviceName: string;
  @Value('version')
  serviceVersion: string;
  @Value('SERVICE_TTL', {
    parse: z.coerce.number({ error: 'Invalid SERVICE_TTL' }).parse,
    default: 60,
  }) // In seconds, set to zero to disable ttl
  serviceTtl: number;
}
