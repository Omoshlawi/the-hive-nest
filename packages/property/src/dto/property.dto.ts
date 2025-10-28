import { QueryBuilderSchema } from '@hive/common';
import { QueryParamsUtils } from '@hive/utils';
import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';
import {
  Address,
  Icon,
  Organization,
  Property,
  PropertyStatusHistory,
  Relationship,
} from '../types';
import { GetPropertyAmenityResponseDto } from './property-amenity.dto';
import { GetPropertyAttributeResponseDto } from './property-attributes.dto';
import { GetPropertyCategoryResponseDto } from './property-category.dto';
import {
  GetPropertyMediaResponseDto,
  PropertyMediaSchema,
} from './property-media.dto';

export const QueryPropertySchema = z.object({
  ...QueryBuilderSchema.shape,
  search: z.string().optional(),
  amenities: z
    .string()
    .describe('Comma seperated amenity uuids or names')
    .optional()
    .refine(
      (data) => {
        if (!data) return true;
        return QueryParamsUtils.isValidArrayString(data);
      },
      { error: 'Invalid amenities' },
    )
    .transform((data) => (data ? data.split(',') : [])),
  address: z.uuid().optional(),
  categories: z
    .string()
    .describe('Comma seperated category uuids or names')
    .optional()
    .refine(
      (data) => {
        if (!data) return true;
        return QueryParamsUtils.isValidArrayString(data);
      },
      { error: 'Invalid categories' },
    )
    .transform((data) => (data ? data.split(',') : [])),
  attributes: z
    .string()
    .describe(
      'Comma seperated attribute key value pairs e.g attr1Key,attr1Val,attr2Key,attr2Val',
    )
    .optional()
    .refine((data) => QueryParamsUtils.isValidPairString(data ?? ''), {
      error: 'Invalid attributes',
    })
    .transform((data) => QueryParamsUtils.parseObject(data ?? '')),
  status: z
    .enum([
      'DRAFT',
      'BLOCKED',
      'ARCHIVED',
      'APPROVED',
      'REJECTED',
      'PAUSED',
      'PENDING',
    ])
    .optional(),
  isVirtual: z
    .stringbool({ truthy: ['true', '1'], falsy: ['false', '0'] })
    .optional(),
  organization: z.string().optional(),
  includeVoided: z
    .stringbool({
      truthy: ['true', '1'],
      falsy: ['false', '0'],
    })
    .optional()
    .default(false),
});

export const PropertySchema = z.object({
  name: z.string().nonempty('Required'),
  thumbnail: z.string().optional(),
  isVirtual: z.boolean().optional(),
  attributes: z
    .array(
      z.object({
        attributeId: z.uuid(),
        value: z.string().min(1, 'Required'),
      }),
    )
    .optional(),
  addressId: z.uuid('invalid address'),
  media: z.array(PropertyMediaSchema).optional(),
  amenities: z.array(z.uuid()).optional(),
  categories: z.array(z.uuid()).optional(),
  description: z.string().optional(),
});

export class QueryPropertyDto extends createZodDto(QueryPropertySchema) {}

export class CreatePropertyDto extends createZodDto(PropertySchema) {}

export class UpdatePropertyDto extends createZodDto(
  PropertySchema.omit({
    attributes: true,
    categories: true,
    amenities: true,
    media: true,
  }).partial(),
) {}

export class GetPropertyResponseDto implements Property {
  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description?: string | undefined;

  @ApiProperty({ required: false })
  thumbnail?: string | undefined;

  @ApiProperty()
  isVirtual: boolean;

  @ApiProperty({
    isArray: true,
    required: false,
    type: GetPropertyAttributeResponseDto,
  })
  attributes: GetPropertyAttributeResponseDto[];

  @ApiProperty({
    isArray: true,
    required: false,
    type: GetPropertyMediaResponseDto,
  })
  media: GetPropertyMediaResponseDto[];

  @ApiProperty({
    isArray: true,
    required: false,
    type: GetPropertyAmenityResponseDto,
  })
  amenities: GetPropertyAmenityResponseDto[];

  @ApiProperty({
    isArray: true,
    required: false,
    type: GetPropertyCategoryResponseDto,
  })
  categories: GetPropertyCategoryResponseDto[];

  @ApiProperty()
  addressId: string;

  @ApiProperty()
  propertyNumber: string;

  @ApiProperty()
  organizationId: string;

  @ApiProperty()
  icon: Icon;

  @ApiProperty()
  status: string;

  @ApiProperty()
  relationshipsAsA: Relationship[];

  @ApiProperty()
  relationshipsAsB: Relationship[];

  @ApiProperty()
  address?: Address;

  @ApiProperty()
  organization?: Organization;

  @ApiProperty()
  createdBy: string;

  @ApiProperty()
  statusHistory: PropertyStatusHistory[];

  @ApiProperty()
  id: string;

  @ApiProperty()
  voided: boolean;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class QueryPropertyResponseDto {
  @ApiProperty({ isArray: true, type: GetPropertyResponseDto })
  results: GetPropertyResponseDto[];

  @ApiProperty()
  totalCount: number;
}
