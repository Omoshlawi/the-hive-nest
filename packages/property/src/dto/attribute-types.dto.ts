import { createZodDto } from 'nestjs-zod';
import z from 'zod';
import {
  CustomRepresentationQuerySchema,
  QueryBuilderSchema,
} from '@hive/common';
export const QueryAttributeTypeSchema = z.object({
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
// AttributeType
export const AttributeTypeSchema = z.object({
  ...CustomRepresentationQuerySchema.shape,
  name: z.string().min(1, 'Required'),
  organizationId: z.string().optional(),
  icon: IconSchema,
});

export const GetAttributeTypeSchema = z.object({
  ...CustomRepresentationQuerySchema.shape,
  id: z.uuid(),
});

export const DeleteAttributeTypeSchema = GetAttributeTypeSchema.extend({
  purge: z
    .stringbool({ truthy: ['true', '1'], falsy: ['false', '0'] })
    .optional()
    .default(false),
});

export class QueryAttributeTypeDto extends createZodDto(
  QueryAttributeTypeSchema,
) {}
export class CreatAttributeTypeDto extends createZodDto(AttributeTypeSchema) {}
export class UpdateAttributeTypeDto extends createZodDto(
  AttributeTypeSchema.omit({ organizationId: true }).partial(),
) {}
export class GetAttributeTypeDto extends createZodDto(GetAttributeTypeSchema) {}
export class DeleteAttributeTypeDto extends createZodDto(
  DeleteAttributeTypeSchema,
) {}
