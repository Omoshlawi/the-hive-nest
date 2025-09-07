import { Configuration, Value } from '@itgorillaz/configify';
import { StorageStrategy } from 'src/storage/storage.interfaces';
import z from 'zod';

@Configuration()
export class AppConfig {
  @Value('PORT', { parse: z.coerce.number().parse, default: 4001 })
  port: number;
  @Value('STORAGE_STRATEGY', { default: 'redis' })
  storageStategy: StorageStrategy;
  @Value('REDIS_DB_URL')
  redisDbUrl: string;
  @Value('name')
  serviceName: string;
  @Value('version')
  serviceVersion: string;
  @Value('SERVICE_TTL', { parse: z.coerce.number().parse, default: 60 }) // In seconds, set to zero to disable ttl
  serviceTtl: number;
}
