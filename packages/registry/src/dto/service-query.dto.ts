import { createZodDto } from 'nestjs-zod';
import { SERVICE_NAME_REGEX } from '../constants';
import z from 'zod';
//   { title: 'Service Info query ' },

export const ListServicesSchema = z.object({
  // example: '@hive/sample-service',
  // description: `Must follow pattern \`${SERVICE_NAME_REGEX}\``,
  name: z.string().regex(SERVICE_NAME_REGEX).optional(),
  //       example: 'service-instance-uuid-123',
  version: z.string().optional(),
  tags: z.string().nonempty().array().optional().default([]),
});
//   { title: 'Heartbit Query', description: 'Heart bit payload' },
export const SendHeartbeatSchema = z.object({
  // example: 'service-instance-uuid-123',
  serviceId: z.string(),
});

export const GetServiceSchema = z.object({
  name: z.string().regex(SERVICE_NAME_REGEX),
  version: z.string(),
});

export class ListServicesDto extends createZodDto(ListServicesSchema) {}
export class SendHeartbeatDto extends createZodDto(SendHeartbeatSchema) {}
export class GetServiceDto extends createZodDto(GetServiceSchema) {}
