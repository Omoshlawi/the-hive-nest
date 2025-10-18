import { QueryBuilderSchema } from '@hive/common';
import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';
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

// IconSchema
const IconSchema = z.object({
  name: z.string().min(1, 'Required'),
  family: z.string().min(1, 'Required'),
});
// Category
export const CategorySchema = z.object({
  name: z.string().min(1, 'Required'),
  organizationId: z.string().optional(),
  icon: IconSchema,
});

export class QueryCategoryDto extends createZodDto(QueryCategorySchema) {}
export class CreatCategoryDto extends createZodDto(CategorySchema) {}
export class UpdateCategoryDto extends createZodDto(
  CategorySchema.omit({ organizationId: true }).partial(),
) {}

export class GetCategoryResponseDto extends CreatCategoryDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  voided: boolean;
  @ApiProperty()
  createdAt: string;
  @ApiProperty()
  updatedAt: string;
  @ApiProperty({ isArray: true, type: 'string' })
  properties?: Array<string>;
}

export class QueryCategoryResponseDto {
  @ApiProperty({ isArray: true, type: GetCategoryResponseDto })
  results: GetCategoryResponseDto[];
  @ApiProperty()
  totalCount: number;
}
