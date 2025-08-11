import { createZodDto } from 'nestjs-zod';
import { SERVICE_NAME_REGEX } from '../constants';
import z from 'zod';
// { title: 'Service', description: 'Service Information' }
const RegisterServiceSchema = z.object({
  //  example: '@hive/sample-service',
  // description: `Must follow pattern \`${SERVICE_NAME_REGEX}\``,
  name: z.string().regex(SERVICE_NAME_REGEX).max(20),
  //{ example: 'localhost' }
  host: z.ipv4(),
  //      example: 3001,
  port: z.coerce.number().int().min(1).max(65535),
  //  { example: '1.0.0' }
  version: z.string(),
  // { example: 'service-instance-uuid-123' }
  tags: z.string().array().optional().default([]),
  metadata: z.record(z.string(), z.string()).optional(),
});

export class RegisterServiceDto extends createZodDto(RegisterServiceSchema) {}
