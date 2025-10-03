import { Controller, Get, UseGuards } from '@nestjs/common';
import {
    AuthGuard,
    AuthService,
    Session,
    UserSession,
} from '@thallesp/nestjs-better-auth';
import { PrismaService } from '../prisma/prisma.service';

@Controller('/extended/auth')
@UseGuards(AuthGuard)
export class AuthExtendedController {
  constructor(
    private readonly authService: AuthService,
    private readonly prismaService: PrismaService,
  ) {}

  @Get('/organization/list-user-memberships')
  async listUserMemberships(@Session() { user }: UserSession) {
    return await this.prismaService.member.findMany({
      where: { userId: user.id },
      include: {
        organization: true,
      },
    });
  }
}
