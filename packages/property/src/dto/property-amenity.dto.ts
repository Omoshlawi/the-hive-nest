import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';
import { Property, PropertyAmenity } from '../types';
import { GetAmenityResponseDto } from './amenities.dto';

// Property Amenity
export const PropertyAmenitySchema = z.object({
  propertyId: z.uuid(),
  amenityId: z.uuid(),
});

export class CreatPropertyAmenityDto extends createZodDto(
  PropertyAmenitySchema,
) {}

export class UpdatePropertyAmenityDto extends createZodDto(
  PropertyAmenitySchema.partial(),
) {}

export class GetPropertyAmenityResponseDto implements PropertyAmenity {
  @ApiProperty()
  propertyId: string;
  @ApiProperty()
  amenityId: string;
  @ApiProperty()
  property?: Property | undefined;
  @ApiProperty()
  id: string;
  @ApiProperty({ type: GetAmenityResponseDto })
  amenity: GetAmenityResponseDto;
  @ApiProperty()
  voided: boolean;
  @ApiProperty()
  createdAt: string;
  @ApiProperty()
  updatedAt: string;
}

export class QueryPropertyAmenityResponseDto {
  @ApiProperty({ isArray: true, type: GetPropertyAmenityResponseDto })
  results: GetPropertyAmenityResponseDto[];
  @ApiProperty()
  totalCount: number;
}
