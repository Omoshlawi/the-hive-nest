import { createZodDto } from 'nestjs-zod';
import z from 'zod';
import {
  CustomRepresentationQuerySchema,
  QueryBuilderSchema,
} from '@hive/common';
export const QueryAmenitySchema = z.object({
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

// IconSchema
const IconSchema = z.object({
  name: z.string().min(1, 'Required'),
  family: z.string().min(1, 'Required'),
});
// Amenity
export const AmenitySchema = z.object({
  ...CustomRepresentationQuerySchema.shape,
  name: z.string().min(1, 'Required'),
  organizationId: z.string().optional(),
  icon: IconSchema,
});

export const GetAmenitySchema = z.object({
  ...CustomRepresentationQuerySchema.shape,
});

export const DeleteAmenitySchema = GetAmenitySchema.extend({
  purge: z
    .stringbool({ truthy: ['true', '1'], falsy: ['false', '0'] })
    .optional()
    .default(false),
});

export class QueryAmenityDto extends createZodDto(QueryAmenitySchema) {}
export class CreatAmenityDto extends createZodDto(AmenitySchema) {}
export class UpdateAmenityDto extends createZodDto(
  AmenitySchema.omit({ organizationId: true }).partial(),
) {}
export class GetAmenityDto extends createZodDto(GetAmenitySchema) {}
export class DeleteAmenityDto extends createZodDto(DeleteAmenitySchema) {}
