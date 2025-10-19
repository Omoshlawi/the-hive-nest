/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { QueryBuilderSchema } from '@hive/common';
import { QueryParamsUtils } from '@hive/utils';
import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const QueryPropertySchema = z.object({
  ...QueryBuilderSchema.shape,
  search: z.string().optional(),
  amenities: z
    .string()
    .describe('Comma seperated amenity uuids')
    .optional()
    .refine(
      (data) => {
        if (!data) return true;
        return (
          QueryParamsUtils.isValidArrayString(data) &&
          QueryParamsUtils.parseArray(data).every(
            (uuid) => z.uuid().safeParse(uuid).success,
          )
        );
      },
      { error: 'Invalid uuids' },
    )
    .transform((data) => (data ? data.split(',') : [])),
  address: z.uuid().optional(),
  categories: z
    .string()
    .describe('Comma seperated category uuids')
    .optional()
    .refine(
      (data) => {
        if (!data) return true;
        return (
          QueryParamsUtils.isValidArrayString(data) &&
          QueryParamsUtils.parseArray(data).every(
            (uuid) => z.uuid().safeParse(uuid).success,
          )
        );
      },
      { error: 'Invalid uuids' },
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
  includeVoided: z
    .stringbool({
      truthy: ['true', '1'],
      falsy: ['false', '0'],
    })
    .optional()
    .default(false),
});

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

export class UpdatePropertyDto extends createZodDto(PropertySchema.partial()) {}

export class GetPropertyResponseDto extends CreatePropertyDto {
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
