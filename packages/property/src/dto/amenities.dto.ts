import { QueryBuilderSchema } from '@hive/common';
import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { Amenity, Icon, PropertyAmenity } from '../types';
import z from 'zod';
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
  name: z.string().min(1, 'Required'),
  organizationId: z.string().optional(),
  icon: IconSchema,
});

export class QueryAmenityDto extends createZodDto(QueryAmenitySchema) {}
export class CreatAmenityDto extends createZodDto(AmenitySchema) {}
export class UpdateAmenityDto extends createZodDto(
  AmenitySchema.omit({ organizationId: true }).partial(),
) {}

export class GetAmenityResponseDto implements Amenity {
  assignedProperties: PropertyAmenity[];
  @ApiProperty()
  name: string;
  @ApiProperty()
  organizationId?: string | undefined;
  @ApiProperty()
  icon: Icon | undefined;
  @ApiProperty()
  id: string;
  @ApiProperty()
  voided: boolean;
  @ApiProperty()
  createdAt: string;
  @ApiProperty()
  updatedAt: string;
}

export class QueryAmenityResponseDto {
  @ApiProperty({ isArray: true, type: GetAmenityResponseDto })
  results: GetAmenityResponseDto[];
  @ApiProperty()
  totalCount: number;
}
