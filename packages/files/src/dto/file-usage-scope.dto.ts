import { QueryBuilderSchema } from '@hive/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';
export const QueryFileUsageScopeSchema = z.object({
  ...QueryBuilderSchema.shape,
  search: z.string().optional(),
  modelName: z.string().optional(),
  purpose: z.string().optional(),
  includeVoided: z
    .stringbool({
      truthy: ['true', '1'],
      falsy: ['false', '0'],
    })
    .optional()
    .default(false),
});

export const FileUsageScopeSchema = z.object({
  modelName: z.string().nonempty(),
  purpose: z.string().nonempty(),
  description: z.string().optional(),
});

export class QueryFileUsageScopeDto extends createZodDto(
  QueryFileUsageScopeSchema,
) {}
export class CreatFileUsageScopeDto extends createZodDto(
  FileUsageScopeSchema,
) {}
export class UpdateFileUsageScopeDto extends createZodDto(
  FileUsageScopeSchema.partial(),
) {}
