import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';
import { GetCategoryResponseDto } from './category.dto';

// property category
export const PropertyCategorySchema = z.object({
  propertyId: z.uuid(),
  categoryId: z.uuid(),
});

export class CreatPropertyCategoryDto extends createZodDto(
  PropertyCategorySchema,
) {}

export class UpdatePropertyCategoryDto extends createZodDto(
  PropertyCategorySchema.partial(),
) {}

export class GetPropertyCategoryResponseDto extends CreatPropertyCategoryDto {
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
