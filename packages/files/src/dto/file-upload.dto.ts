import z from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ApiProperty } from '@nestjs/swagger';
import { COMMA_SEPARATED_REGEX } from '@hive/utils';
export const UploadFileSchema = z.object({
  relatedModelName: z
    .string()
    .nonempty()
    .describe('Entity model the image is attached to'),
  relatedModelId: z
    .string()
    .nonempty()
    .describe('Actual entity instance the image is atttached to'),
  purpose: z
    .string()
    .nonempty()
    .describe('Purpose e.g avatar, thumbnail, e.t.c'),
  tags: z.string().regex(COMMA_SEPARATED_REGEX),
});

export class UploadMutipleFilesDto extends createZodDto(UploadFileSchema) {
  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' } })
  files: any[];
}
export class UploadSingleFileDto extends createZodDto(UploadFileSchema) {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;
}
export class UploadFilesDto extends createZodDto(UploadFileSchema) {}
