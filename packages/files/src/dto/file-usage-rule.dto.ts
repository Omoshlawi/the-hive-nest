import { QueryBuilderSchema } from '@hive/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';
export const QueryFileUsageRuleSchema = z.object({
  ...QueryBuilderSchema.shape,
  search: z.string().optional(),
  modelName: z.string().optional(),
  scopeId: z.string().optional(),
  purpose: z.string().optional(),
  includeVoided: z
    .stringbool({
      truthy: ['true', '1'],
      falsy: ['false', '0'],
    })
    .optional()
    .default(false),
});

export const FileUsageRuleSchema = z.object({
  scopeId: z.uuid(),
  maxFiles: z.coerce.number().positive(),
});

export class QueryFileUsageRuleDto extends createZodDto(
  QueryFileUsageRuleSchema,
) {}
export class CreatFileUsageRuleDto extends createZodDto(FileUsageRuleSchema) {}
export class UpdateFileUsageRuleDto extends createZodDto(
  FileUsageRuleSchema.partial(),
) {}
