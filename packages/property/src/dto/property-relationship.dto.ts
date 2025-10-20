import { QueryBuilderSchema } from '@hive/common';
import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const QueryPropertyRelationshipSchema = z.object({
  ...QueryBuilderSchema.shape,
  search: z.string().optional(),
  propertyAId: z.uuid().optional(),
  propertyBId: z.uuid().optional(),
  propertyId: z.uuid().optional(),
  typeId: z.uuid().optional(),
  startDate: z.iso.date().optional(),
  endDate: z.iso.date().optional(),
  includeVoided: z
    .stringbool({
      truthy: ['true', '1'],
      falsy: ['false', '0'],
    })
    .optional()
    .default(false),
});

// Relationship
export const PropertyRelationshipSchema = z.object({
  //   propertyAId: z.uuid(),
  propertyBId: z.uuid(),
  startDate: z.iso.date(),
  endDate: z.iso.date().optional(),
  typeId: z.uuid(),
});

export class QueryPropertyRelationshipDto extends createZodDto(
  QueryPropertyRelationshipSchema,
) {}

export class CreatePropertyRelationshipDto extends createZodDto(
  PropertyRelationshipSchema,
) {}

export class UpdatePropertyRelationshipDto extends createZodDto(
  PropertyRelationshipSchema.partial(),
) {}

export class GetPropertyRelationshipResponseDto extends CreatePropertyRelationshipDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  voided: boolean;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class QueryPropertyRelationshipResponseDto {
  @ApiProperty({ isArray: true, type: GetPropertyRelationshipResponseDto })
  results: GetPropertyRelationshipResponseDto[];

  @ApiProperty()
  totalCount: number;
}
