/* eslint-disable @typescript-eslint/unbound-method */
import { Configuration, Value } from '@itgorillaz/configify';
import z from 'zod';

@Configuration()
export class AppConfig {
  @Value('PORT', { parse: z.coerce.number({ error: 'Invalid PORT' }).parse })
  port: number;
  @Value('BETTER_AUTH_URL', {
    parse: z.url({ error: 'Invalid BETTER_AUTH_URL' }).parse,
  })
  betterAuthUrl: string;
  @Value('BETTER_AUTH_TRUSTED_ORIGINS', {
    parse: z.string().default('').parse,
  })
  private _trustedOrigin: string;

  @Value('BETTER_AUTH_DISABLE_CSRF_CHECK', {
    parse: z
      .stringbool({
        truthy: ['true', '1'],
        falsy: ['false', '0'],
        error: 'Invalid BETTER_AUTH_DISABLE_CSRF_CHECK',
      })
      .default(false).parse,
  })
  disableCSRFCheck: boolean;

  get trustedOrigins(): string[] {
    return this._trustedOrigin
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
  }
}
