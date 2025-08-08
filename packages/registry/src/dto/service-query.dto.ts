import { extendApi } from '@anatine/zod-openapi';
import { SERVICE_NAME_REGEX } from '../constants';
import z from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

export const ServiceInfoQuerySchema = extendApi(
  z.object({
    name: extendApi(z.string().regex(SERVICE_NAME_REGEX).optional(), {
      example: '@hive/sample-service',
      description: `Must follow pattern \`${SERVICE_NAME_REGEX}\``,
    }),
    instanceId: extendApi(z.string().optional(), {
      example: 'service-instance-uuid-123',
    }),
  }),
  { title: 'Service Info query ' },
);

export const HeartbeatQuerySchema = extendApi(
  z.object({
    instanceId: extendApi(z.string().optional(), {
      example: 'service-instance-uuid-123',
    }),
  }),
  { title: 'Heartbit Query', description: 'Heart bit payload' },
);

export class ServiceInfoQueryDto extends createZodDto(ServiceInfoQuerySchema) {}
export class HeartbeatQueryDto extends createZodDto(HeartbeatQuerySchema) {}
