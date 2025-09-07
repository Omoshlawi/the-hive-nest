import z from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ApiProperty } from '@nestjs/swagger';
export const UploadFileSchema = z.object({
  uploadTo: z
    .string()
    .nonempty()
    .describe('Destination folder within the S3 bucket'),
  isPublic: z
    .stringbool({ truthy: ['true', '1'], falsy: ['false', '0'] })
    .optional()
    .describe('Whether to make the file publicly accessible')
    .default(false),
  metadata: z
    .record(z.string(), z.string())
    .optional()
    .describe("'Custom metadata for the file'"),
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
