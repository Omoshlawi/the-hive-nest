import { Configuration, Value } from '@itgorillaz/configify';
import z from 'zod';

@Configuration()
export class AppConfig {
  @Value('PORT', { parse: z.coerce.number().parse })
  port: number;
}
