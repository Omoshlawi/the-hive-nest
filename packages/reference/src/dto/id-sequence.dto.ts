import { QueryBuilderSchema } from '@hive/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const IdentifierSequenceSchema = z.object({
  dataModel: z.string().nonempty(),
  prefix: z
    .string()
    .nonempty()
    .regex(/^[A-Z]{2,6}$/),
  width: z.coerce.number().min(4).max(12).optional().default(6),
});

export const QueryIdentifierSequenceSchema = z.object({
  ...QueryBuilderSchema.shape,
  dataModel: z.string().optional(),
  updatedAtFrom: z.coerce.date().optional(),
  updatedAtTo: z.coerce.date().optional(),
});

export class QueryIdentifierSequenceDto extends createZodDto(
  QueryIdentifierSequenceSchema,
) {}
export class CreatIdentifierSequenceDto extends createZodDto(
  IdentifierSequenceSchema,
) {}
