import { createZodDto } from 'nestjs-zod';
import { SERVICE_NAME_REGEX } from '../constants';
import z from 'zod';
//   { title: 'Service Info query ' },

export const ServiceQuerySchema = z.object({
  // example: '@hive/sample-service',
  // description: `Must follow pattern \`${SERVICE_NAME_REGEX}\``,
  name: z.string().regex(SERVICE_NAME_REGEX).optional(),
  //       example: 'service-instance-uuid-123',

  instanceId: z.string().optional(),
});
//   { title: 'Heartbit Query', description: 'Heart bit payload' },
export const HeartbeatSchema = z.object({
  // example: 'service-instance-uuid-123',
  instanceId: z.string().optional(),
});

export type ServiceQueryDto = z.infer<typeof ServiceQuerySchema>;
export class HeartbeatDto extends createZodDto(HeartbeatSchema) {}
