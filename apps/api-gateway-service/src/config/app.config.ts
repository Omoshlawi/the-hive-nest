import { Configuration, Value } from '@itgorillaz/configify';
import z from 'zod';

@Configuration()
export class AppConfig {
  @Value('PORT', { parse: z.coerce.number().parse })
  port: number;
  @Value('BETTER_AUTH_URL', { parse: z.url().parse })
  betterAuthUrl: string;
}
