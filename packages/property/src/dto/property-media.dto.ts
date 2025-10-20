import { QueryBuilderSchema } from '@hive/common';
import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { Property, PropertyMedia } from 'types';
import z from 'zod';

export const QueryPropertyMediaSchema = z.object({
  ...QueryBuilderSchema.shape,
  search: z.string().optional(),
  type: z.enum(['IMAGE', 'VIDEO', 'DOCUMENT', 'TOUR_3D']).optional(),
  size: z.coerce.number().optional(),
  memeType: z.string().optional(),
  includeVoided: z
    .stringbool({
      truthy: ['true', '1'],
      falsy: ['false', '0'],
    })
    .optional()
    .default(false),
});

// Property Media
export const PropertyMediaSchema = z.object({
  // propertyId: z.string().uuid(),
  type: z.enum(['IMAGE', 'VIDEO', 'DOCUMENT', 'TOUR_3D']),
  url: z.string().min(1, 'Required'),
  title: z.string().min(1, 'Required').optional(),
  description: z.string().min(1, 'Required').optional(),
  order: z.coerce.number().int().nonnegative().optional(),
  metadata: z.object({
    size: z.coerce.number(),
    memeType: z.string().min(1, 'Required').optional(),
    id: z.uuid().optional(),
  }),
});

export class QueryPropertyMediaDto extends createZodDto(
  QueryPropertyMediaSchema,
) {}

export class CreatePropertyMediaDto extends createZodDto(PropertyMediaSchema) {}

export class UpdatePropertyMediaDto extends createZodDto(
  PropertyMediaSchema.partial(),
) {}

export class GetPropertyMediaResponseDto implements PropertyMedia {
  @ApiProperty()
  propertyId: string;

  @ApiProperty()
  property?: Property | undefined;

  @ApiProperty()
  type: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  title?: string | undefined;

  @ApiProperty()
  description?: string | undefined;

  @ApiProperty()
  metadata: { [key: string]: string };

  @ApiProperty()
  order: number;

  @ApiProperty()
  id: string;

  @ApiProperty()
  voided: boolean;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class QueryPropertyMediaResponseDto {
  @ApiProperty({ isArray: true, type: GetPropertyMediaResponseDto })
  results: GetPropertyMediaResponseDto[];

  @ApiProperty()
  totalCount: number;
}
