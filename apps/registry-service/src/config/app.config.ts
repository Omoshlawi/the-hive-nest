import { Configuration, Value } from '@itgorillaz/configify';
import z from 'zod';
import {} from '@hive/registry';

@Configuration()
export class AppConfig {
  @Value('PORT', { parse: z.coerce.number().parse })
  port: number;
}
