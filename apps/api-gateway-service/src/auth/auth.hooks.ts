/* eslint-disable @typescript-eslint/require-await */
import { Injectable } from '@nestjs/common';
import { Hook, AuthHookContext, AfterHook } from '@thallesp/nestjs-better-auth';
import { Invitation } from 'better-auth/plugins';
import { PrismaService } from 'src/prisma/prisma.service';

@Hook()
@Injectable()
export class AuthHookHook {
  constructor(private readonly prismaService: PrismaService) {}
  @AfterHook('/organization/list-user-invitations')
  async handle(ctx: AuthHookContext) {
    if (!Array.isArray(ctx.context.returned)) return;
    const respose = ctx.context.returned as Array<Invitation>;
    const ret = await this.prismaService.invitation.findMany({
      where: { id: { in: respose?.map((r) => r.id) } },
      include: {
        organization: true,
        user: {
          select: { id: true, email: true, displayUsername: true, image: true },
        },
      },
    });
    ctx.context.returned = ret;
  }
}
