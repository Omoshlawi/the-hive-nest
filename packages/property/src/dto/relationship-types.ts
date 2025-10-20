import { QueryBuilderSchema } from '@hive/common';
import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { Relationship, RelationshipType } from '../types';
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

export class GetRelationshipTypeResponseDto implements RelationshipType {
  relationships: Relationship[];
  
  @ApiProperty()
  description?: string | undefined;

  @ApiProperty()
  aIsToB: string;

  @ApiProperty()
  bIsToA: string;

  @ApiProperty()
  id: string;

  @ApiProperty()
  voided: boolean;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class QueryRelationshipTypeResponseDto {
  @ApiProperty({ isArray: true, type: GetRelationshipTypeResponseDto })
  results: GetRelationshipTypeResponseDto[];
  @ApiProperty()
  totalCount: number;
}
