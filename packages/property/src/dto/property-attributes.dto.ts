import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import z, { string } from 'zod';
import { GetAttributeTypeResponseDto } from './attribute-types.dto';

// Property attribute
export const PropertyAttributeSchema = z.object({
  attributeId: z.uuid(),
  value: z.string().min(1, 'Required'),
});

export class CreatPropertyAttributeDto extends createZodDto(
  PropertyAttributeSchema,
) {}

export class UpdatePropertyAttributeDto extends createZodDto(
  PropertyAttributeSchema.partial(),
) {}

export class GetPropertyAttributeResponseDto extends CreatPropertyAttributeDto {
  @ApiProperty()
  id: string;
  @ApiProperty({ type: GetAttributeTypeResponseDto })
  attribute: GetAttributeTypeResponseDto;
  @ApiProperty()
  propertyId: string;
  @ApiProperty({ type: string })
  property: string;
  @ApiProperty()
  voided: boolean;
  @ApiProperty()
  createdAt: string;
  @ApiProperty()
  updatedAt: string;
}

export class QueryPropertyAttributeResponseDto {
  @ApiProperty({ isArray: true, type: GetPropertyAttributeResponseDto })
  results: GetPropertyAttributeResponseDto[];
  @ApiProperty()
  totalCount: number;
}
