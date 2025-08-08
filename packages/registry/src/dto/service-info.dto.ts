import { createZodDto } from '@anatine/zod-nestjs';
import { SERVICE_NAME_REGEX } from '../constants';
import z from 'zod';
import { extendApi } from '@anatine/zod-openapi';

const ServiceInfoSchema = extendApi(
  z.object({
    name: extendApi(z.string().regex(SERVICE_NAME_REGEX), {
      example: '@hive/sample-service',
      description: `Must follow pattern \`${SERVICE_NAME_REGEX}\``,
    }),
    host: extendApi(z.ipv4(), { example: 'localhost' }),
    port: extendApi(z.coerce.number().int().min(1).max(65535), {
      example: 3001,
      type: 'number',
      minimum: 1,
      maximum: 65535,
    }),
    version: extendApi(z.string(), { example: '1.0.0' }),
    instanceId: extendApi(z.string(), { example: 'service-instance-uuid-123' }),
    ttl: extendApi(z.coerce.number().min(30).optional(), {
      example: 300,
      required: ['Optional'],
      type: 'number',
      minimum: 30,
    }),
    metadata: extendApi(z.object().optional(), {
      required: ['optional'],
      type: 'object',
    }),
  }),
  { title: 'Service', description: 'Service Information' },
);

export class ServiceInfoDto extends createZodDto(ServiceInfoSchema) {}
