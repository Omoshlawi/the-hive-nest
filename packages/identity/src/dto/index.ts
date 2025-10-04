/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import z from 'zod';
import { createZodDto } from 'nestjs-zod';
import { QueryBuilderSchema } from '@hive/common';

export const TeamMembershipQuerySchema = z.object({
  ...QueryBuilderSchema.shape,
  organizationId: z.string().optional(),
});

export class TeamMembershipQueryDto extends createZodDto(
  TeamMembershipQuerySchema,
) {}
