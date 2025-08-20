import { createZodDto } from 'nestjs-zod';
import { SERVICE_NAME_REGEX } from '../constants';
import z from 'zod';

export const RegistryServiceEndpointSchema = z.object({
  //{ example: 'localhost' }
  host: z.ipv4(),
  //      example: 3001,
  port: z.coerce.number().int().min(1).max(65535),
  protocol: z.enum(['HTTP', 'GRPC']),
  metadata: z.record(z.string(), z.string()).optional(),
});
// { title: 'Service', description: 'Service Information' }
export const RegisterServiceSchema = z.object({
  //  example: '@hive/sample-service',
  // description: `Must follow pattern \`${SERVICE_NAME_REGEX}\``,
  name: z.string().regex(SERVICE_NAME_REGEX).max(20),
  //  { example: '1.0.0' }
  version: z.string(),
  // { example: 'service-instance-uuid-123' }
  tags: z.string().array().optional().default([]),
  metadata: z.record(z.string(), z.string()).optional(),
  endpoints: RegistryServiceEndpointSchema.array().nonempty(),
});

export class RegisterServiceDto extends createZodDto(RegisterServiceSchema) {}
export class RegistryServiceEndpointDto extends createZodDto(
  RegistryServiceEndpointSchema,
) {}
