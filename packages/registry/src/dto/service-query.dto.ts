import { createZodDto } from 'nestjs-zod';
import { SERVICE_NAME_REGEX } from '../constants';
import z from 'zod';
import { COMMA_SEPARATED_REGEX } from '@hive/utils';
//   { title: 'Service Info query ' },

export const QueryServicesSchema = z.object({
  // example: '@hive/sample-service',
  // description: `Must follow pattern \`${SERVICE_NAME_REGEX}\``,
  name: z.string().regex(SERVICE_NAME_REGEX).optional(),
  //       example: 'service-instance-uuid-123',
  version: z.string().optional(),
  tags: z
    .string()
    .regex(COMMA_SEPARATED_REGEX)
    .describe('Qoted Comma seperated values, must not have spaces')
    .optional(),
  metadata: z
    .string()
    .regex(COMMA_SEPARATED_REGEX)
    .describe('Quoted Comma seperated key value pairs')
    .optional()
    .refine(
      (val) => (val?.replaceAll(' ', '')?.split(',')?.length ?? 2) % 2 === 0,
      {
        error: 'Must be key value pairs',
      },
    ),
});
//   { title: 'Heartbit Query', description: 'Heart bit payload' },
export const SendHeartbeatSchema = z.object({
  // example: 'service-instance-uuid-123',
  serviceId: z.string(),
});

export class QueryServicesDto extends createZodDto(QueryServicesSchema) {}
export class SendHeartbeatDto extends createZodDto(SendHeartbeatSchema) {}
