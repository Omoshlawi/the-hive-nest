/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { CustomRepresentationService, SortService } from '@hive/common';
import { TeamMembershipQueryDto } from '@hive/identity';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  AuthGuard,
  AuthService,
  Session,
  UserSession,
} from '@thallesp/nestjs-better-auth';
import { PrismaService } from '../prisma/prisma.service';
import { BetterAuthWithPlugins } from './auth.types';

@Controller('/extended/auth')
@UseGuards(AuthGuard)
export class AuthExtendedController {
  constructor(
    private readonly authService: AuthService<BetterAuthWithPlugins>,
    private readonly prismaService: PrismaService,
    private readonly sortService: SortService,
    private readonly representationService: CustomRepresentationService,
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
  @Get('/organization/team/list-user-memberships')
  async listUserTeamMemberships(
    @Session() { user }: UserSession,
    @Query() teamMembershipQueryDto: TeamMembershipQueryDto,
  ) {
    return await this.prismaService.teamMember.findMany({
      where: {
        userId: user.id,
        team: {
          organizationId: teamMembershipQueryDto?.organizationId as string,
        },
      },
      ...this.representationService.buildCustomRepresentationQuery(
        teamMembershipQueryDto?.v,
      ),

      ...this.sortService.buildSortQuery(teamMembershipQueryDto?.orderBy),
    });
  }
  //   @Post('/organization/add-member')
  //   async addMember(@Session() { user }: UserSession) {
  //     return await this.authService.api.addMember({body: {}})
  //   }
}
