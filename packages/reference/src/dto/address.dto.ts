import { QueryBuilderSchema } from '@hive/common';
import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const QueryAddressSchema = z.object({
  ...QueryBuilderSchema.shape,
  search: z.string().optional(),
  userId: z.string().optional(),
  organizationId: z.string().optional(),
  type: z.string().optional(),
  level1: z.string().optional(),
  level2: z.string().optional(),
  level3: z.string().optional(),
  level4: z.string().optional(),
  level5: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  startDateFrom: z.iso.date().optional(),
  startDateTo: z.iso.date().optional(),
  endDateFrom: z.iso.date().optional(),
  endDateTo: z.iso.date().optional(),
  createdAtFrom: z.iso.date().optional(),
  createdAtTo: z.iso.date().optional(),
  includeVoided: z
    .stringbool({
      truthy: ['true', '1'],
      falsy: ['false', '0'],
    })
    .optional()
    .default(false),
});

export const AddressSchema = z.object({
  userId: z.string(),
  isOrganizationAddress: z.boolean(),
  type: z.string(),
  label: z.string().optional(),
  address1: z.string(),
  address2: z.string().optional(),
  landmark: z.string().optional(),
  level1: z.string(),
  level2: z.string().optional(),
  level3: z.string().optional(),
  level4: z.string().optional(),
  level5: z.string().optional(),
  cityVillage: z.string().optional(),
  stateProvince: z.string().optional(),
  country: z.string(),
  postalCode: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  plusCode: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  preferred: z.boolean().optional(),
  formatted: z.string().optional(),
  localeFormat: z
    .record(z.string().nonempty(), z.string().nonempty())
    .optional(),
});

export class QueryAddressDto extends createZodDto(QueryAddressSchema) {}

export class CreateAddressDto extends createZodDto(AddressSchema) {}

export class UpdateAddressDto extends createZodDto(AddressSchema.partial()) {}

export class GetAddressResponseDto extends CreateAddressDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  voided: boolean;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class QueryAddressResponseDto {
  @ApiProperty({ isArray: true, type: GetAddressResponseDto })
  results: GetAddressResponseDto[];

  @ApiProperty()
  totalCount: number;
}
