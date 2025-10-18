import { QueryBuilderSchema } from '@hive/common';
import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';
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

// IconSchema
const IconSchema = z.object({
  name: z.string().min(1, 'Required'),
  family: z.string().min(1, 'Required'),
});
// AttributeType
export const AttributeTypeSchema = z.object({
  name: z.string().min(1, 'Required'),
  organizationId: z.string().optional(),
  icon: IconSchema,
});

export class QueryAttributeTypeDto extends createZodDto(
  QueryAttributeTypeSchema,
) {}
export class CreatAttributeTypeDto extends createZodDto(AttributeTypeSchema) {}
export class UpdateAttributeTypeDto extends createZodDto(
  AttributeTypeSchema.omit({ organizationId: true }).partial(),
) {}

export class GetAttributeTypeResponseDto extends CreatAttributeTypeDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  voided: boolean;
  @ApiProperty()
  createdAt: string;
  @ApiProperty()
  updatedAt: string;
  @ApiProperty({ isArray: true, type: 'string' })
  assignedProperties?: Array<string>;
}

export class QueryAttributeTypeResponseDto {
  @ApiProperty({ isArray: true, type: GetAttributeTypeResponseDto })
  results: GetAttributeTypeResponseDto[];
  @ApiProperty()
  totalCount: number;
}
