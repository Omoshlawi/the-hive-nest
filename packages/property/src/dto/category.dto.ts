import { createZodDto } from 'nestjs-zod';
import z from 'zod';
import {
  CustomRepresentationQuerySchema,
  QueryBuilderSchema,
} from '@hive/common';
export const QueryCategorySchema = z.object({
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

// TODO: make reusable
// IconSchema
const IconSchema = z.object({
  name: z.string().min(1, 'Required'),
  family: z.string().min(1, 'Required'),
});
// Category
export const CategorySchema = z.object({
  ...CustomRepresentationQuerySchema.shape,
  name: z.string().min(1, 'Required'),
  organizationId: z.string().optional(),
  icon: IconSchema,
});

export const GetCategorySchema = z.object({
  ...CustomRepresentationQuerySchema.shape,
  id: z.uuid(),
});

export const DeleteCategorySchema = GetCategorySchema.extend({
  purge: z
    .stringbool({ truthy: ['true', '1'], falsy: ['false', '0'] })
    .optional()
    .default(false),
});

export class QueryCategoryDto extends createZodDto(QueryCategorySchema) {}
export class CreatCategoryDto extends createZodDto(CategorySchema) {}
export class UpdateCategoryDto extends createZodDto(
  CategorySchema.omit({ organizationId: true }).partial(),
) {}
export class GetCategoryDto extends createZodDto(GetCategorySchema) {}
export class DeleteCategoryDto extends createZodDto(DeleteCategorySchema) {}
