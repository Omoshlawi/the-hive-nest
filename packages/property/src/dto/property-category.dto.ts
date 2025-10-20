import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';
import { GetCategoryResponseDto } from './category.dto';
import { Property, PropertyCategory } from '../types';
import { QueryBuilderSchema } from '@hive/common';

// property category
export const PropertyCategorySchema = z.object({
  propertyId: z.uuid(),
  categoryId: z.uuid(),
});

export const QueryPropertyCategorySchema = z.object({
  ...QueryBuilderSchema.shape,
  includeVoided: z
    .stringbool({
      truthy: ['true', '1'],
      falsy: ['false', '0'],
    })
    .optional()
    .default(false),
});

export class QueryPropertyCategoryDto extends createZodDto(
  QueryPropertyCategorySchema,
) {}

export class CreatePropertyCategoryDto extends createZodDto(
  PropertyCategorySchema,
) {}

export class UpdatePropertyCategoryDto extends createZodDto(
  PropertyCategorySchema.partial(),
) {}

export class GetPropertyCategoryResponseDto implements PropertyCategory {
  @ApiProperty()
  propertyId: string;
  @ApiProperty()
  categoryId: string;
  @ApiProperty({})
  property?: Property | undefined;
  @ApiProperty()
  id: string;
  @ApiProperty({ type: GetCategoryResponseDto })
  category: GetCategoryResponseDto;
  @ApiProperty()
  voided: boolean;
  @ApiProperty()
  createdAt: string;
  @ApiProperty()
  updatedAt: string;
}

export class QueryPropertyCategoryResponseDto {
  @ApiProperty({ isArray: true, type: GetPropertyCategoryResponseDto })
  results: GetPropertyCategoryResponseDto[];
  @ApiProperty()
  totalCount: number;
}
