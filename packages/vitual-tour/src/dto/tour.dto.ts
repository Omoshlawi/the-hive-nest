import { QueryBuilderSchema } from '@hive/common';
import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const QueryTourSchema = z.object({
  ...QueryBuilderSchema.shape,
  search: z.string().optional(),
  includeVoided: z
    .stringbool({
      truthy: ['true', '1'],
      falsy: ['false', '0'],
    })
    .optional()
    .default(false),
});

export const TourSchema = z.object({
  fieldName: z.string().nonempty('Required'),
  description: z.string().optional(),
});

export class QueryTourDto extends createZodDto(QueryTourSchema) {}

export class CreateTourDto extends createZodDto(TourSchema) {}

export class UpdateTourDto extends createZodDto(TourSchema.partial()) {}

export class GetTourResponseDto extends CreateTourDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  voided: boolean;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class QueryTourResponseDto {
  @ApiProperty({ isArray: true, type: GetTourResponseDto })
  results: GetTourResponseDto[];

  @ApiProperty()
  totalCount: number;
}
