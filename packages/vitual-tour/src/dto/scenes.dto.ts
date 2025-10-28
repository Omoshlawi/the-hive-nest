import { QueryBuilderSchema } from '@hive/common';
import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const QuerySceneSchema = z.object({
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

export const SceneSchema = z.object({
  fieldName: z.string().nonempty('Required'),
  description: z.string().optional(),
});

export class QuerySceneDto extends createZodDto(QuerySceneSchema) {}

export class CreateSceneDto extends createZodDto(SceneSchema) {}

export class UpdateSceneDto extends createZodDto(SceneSchema.partial()) {}

export class GetSceneResponseDto extends CreateSceneDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  voided: boolean;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

export class QuerySceneResponseDto {
  @ApiProperty({ isArray: true, type: GetSceneResponseDto })
  results: GetSceneResponseDto[];

  @ApiProperty()
  totalCount: number;
}
