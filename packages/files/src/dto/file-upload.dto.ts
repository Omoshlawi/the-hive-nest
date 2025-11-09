import z from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ApiProperty } from '@nestjs/swagger';
import { COMMA_SEPARATED_REGEX } from '@hive/utils';
import { CustomRepresentationQuerySchema, QueryBuilderSchema } from '@hive/common';

export const QueryReqestFileUploadSchema = z.object({
  organization: z.string().optional(),
});
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

export const CompleteFileUploadSchema = z.object({
  ...CustomRepresentationQuerySchema.shape,
  id: z.uuid().describe('File ID'),
});

export const RequestFileUploadSchema = UploadFileSchema.omit({
  tags: true,
}).extend({
  fileName: z.string().nonempty().describe('File name'),
  mimeType: z.string().nonempty().describe('Mime type'),
  expiresIn: z.coerce
    .number()
    .optional()
    .default(3600)
    .describe('Expires in seconds'),
  size: z.coerce.number().min(1).describe('File size in bytes'),
  tags: z.string().array().optional(),
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
export class RequestFileUploadDto extends createZodDto(
  RequestFileUploadSchema,
) {}
export class QueryReqestFileUploadDto extends createZodDto(
  QueryReqestFileUploadSchema,
) {}

export class CompleteFileUploadDto extends createZodDto(
  CompleteFileUploadSchema,
) {}

export class RequestFileUploadResponseDto {
  @ApiProperty()
  signedUrl: string;

  @ApiProperty()
  expiresAt: string;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  originalName: string;

  @ApiProperty()
  storageUrl: string;
}
