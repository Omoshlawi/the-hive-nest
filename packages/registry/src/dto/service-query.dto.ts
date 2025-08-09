import { createZodDto } from 'nestjs-zod';
import { SERVICE_NAME_REGEX } from '../constants';
import z from 'zod';
import semVer from 'semver';
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

export const ServiceByNameandVersionSchema = z.object({
  name: z.string().regex(SERVICE_NAME_REGEX),
  version: z.string().refine(semVer.valid, { error: 'Invalid version' }),
});

export class ServiceQueryDto extends createZodDto(ServiceQuerySchema) {}
export class HeartbeatDto extends createZodDto(HeartbeatSchema) {}
export class ServiceByNameandVersionDto extends createZodDto(
  ServiceByNameandVersionSchema,
) {}
