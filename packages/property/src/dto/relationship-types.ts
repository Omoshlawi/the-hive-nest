import { QueryBuilderSchema } from '@hive/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';
export const QueryRelationshipTypeSchema = z.object({
  ...QueryBuilderSchema.shape,
  search: z.string().optional(),
  includeVoided: z
    .stringbool({
      truthy: ['true', '1'],
      falsy: ['false', '0'],
    })
    .optional()
    .default(false),
});

// IconSchema
const IconSchema = z.object({
  name: z.string().min(1, 'Required'),
  family: z.string().min(1, 'Required'),
});
// RelationshipType
export const RelationshipTypeSchema = z.object({
  aIsToB: z.string().nonempty('Required'),
  bIsToA: z.string().nonempty('Required'),
  description: z.string().optional(),
});

export class QueryRelationshipTypeDto extends createZodDto(
  QueryRelationshipTypeSchema,
) {}
export class CreatRelationshipTypeDto extends createZodDto(
  RelationshipTypeSchema,
) {}
export class UpdateRelationshipTypeDto extends createZodDto(
  RelationshipTypeSchema.partial(),
) {}
