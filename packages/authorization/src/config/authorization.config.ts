import { Configuration, Value } from '@itgorillaz/configify';
import z from 'zod';

@Configuration()
export class AuthorizationConfig {
  @Value('FGA_API_URL', {
    default: 'http://localhost:8080',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    parse: z.url().parse,
  })
  fgaApiUrl: string;
  @Value('FGA_STORE_ID', { default: '01K5NVFDBGNJS29BARVS8840BT' })
  fgaStoreId: string;
  @Value('FGA_MODEL_ID', { default: '01K5SC22YJEFGRT4BGDEBHB78W' })
  fgaModelId: string;
}
