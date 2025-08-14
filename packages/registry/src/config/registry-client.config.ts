import { PORT_TOKEN } from '@hive/common';
import { Configuration, Value } from '@itgorillaz/configify';
import { Inject } from '@nestjs/common';
import z from 'zod';

const toArray = (val: string = '') => {
  return (
    val
      ?.split(',')
      ?.map((v) => v.trim())
      ?.filter(Boolean) ?? []
  );
};

@Configuration()
export class RegistryClientConfig {
  @Value('name')
  serviceName: string;

  @Value('version')
  serviceVersion: string;

  @Value('SERVER_URL', { default: '0.0.0.0:4001' })
  serverUrl: string;

  @Value('TAGS', {
    default: '',
    parse: toArray,
  })
  tags: Array<string>;
  @Value('META', { default: {} })
  metadata: Record<string, string>;
}
