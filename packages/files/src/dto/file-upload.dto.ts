import z from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ApiProperty } from '@nestjs/swagger';
export const UploadFileSchema = z.object({
  uploadTo: z.string().nonempty(),
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
