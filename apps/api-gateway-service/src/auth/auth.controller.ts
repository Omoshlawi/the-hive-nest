/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { CustomRepresentationService, SortService } from '@hive/common';
import { TeamMembershipQueryDto } from '@hive/identity';
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard, AuthService, Session } from '@thallesp/nestjs-better-auth';
import { APIError } from 'better-auth/api';
import { PrismaService } from '../prisma/prisma.service';
import { BetterAuthWithPlugins, UserSession } from './auth.types';

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

  // TODO:add guard decorator for ensuring user only access if org context is set
  @Get('/organization/team/:teamId/list-members')
  async listTeamMembers(
    @Session() { session }: UserSession,
    @Param('teamId') teamId: string,
  ) {
    // Ensure tem suplied belongs to current active organization
    const team = await this.prismaService.team.findUnique({
      where: { id: teamId, organizationId: session.activeOrganizationId },
    });

    if (!team) {
      throw new APIError('BAD_REQUEST', {
        message: 'Team not in current active organization',
        code: 'TEAM_NOT_IN_ACTIVE_ORGANIZATION',
      });
    }

    const members = await this.prismaService.teamMember.findMany({
      where: { teamId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            image: true,
            displayUsername: true,
          },
        },
      },
    });
    return {
      results: members,
    };
  }
  //   @Post('/organization/add-member')
  //   async addMember(@Session() { user }: UserSession) {
  //     return await this.authService.api.addMember({body: {}})
  //   }
}
