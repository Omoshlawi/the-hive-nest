import {
  CustomRepresentationQuerySchema,
  QueryBuilderSchema,
} from '@hive/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';
export const QueryFileSchema = z.object({
  ...QueryBuilderSchema.shape,
  search: z.string().optional(),
  organizationId: z.string().optional(),
  includeVoided: z
    .stringbool({
      truthy: ['true', '1'],
      falsy: ['false', '0'],
    })
    .optional()
    .default(false),
});
export const GetFileByHashQuerySchema = z.object({
  ...CustomRepresentationQuerySchema.shape,
  hash: z.hex().nonempty(),
});

export class QueryFileDto extends createZodDto(QueryFileSchema) {}
export class GetFileByHashQueryDto extends createZodDto(
  GetFileByHashQuerySchema,
) {}
