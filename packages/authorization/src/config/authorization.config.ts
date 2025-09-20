import { Configuration, Value } from '@itgorillaz/configify';
import z from 'zod';

@Configuration()
export class AuthorizationConfig {
  @Value('FGA_API_URL', {
    default: 'http://localhost:3000',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    parse: z.url().parse,
  })
  fgaApiUrl: string;
  @Value('FGA_STORE_ID', { default: '01K51PAYTWS1XNM378CYG3KPRF' })
  fgaStoreId: string;
  @Value('FGA_MODEL_ID', { default: '01K5BQ24BT5JKBFVW308N99H5V' })
  fgaModelId: string;
}
