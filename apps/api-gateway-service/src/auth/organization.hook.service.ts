import { OpenFGAService } from '@hive/authorization';
import {
  AfterHook,
  AuthHookContext,
  AuthService,
  BeforeHook,
  Hook,
} from '@mguay/nestjs-better-auth';
import { HttpExceptionBody, Injectable, Logger } from '@nestjs/common';
import { BetterAuthWithPlugins } from '../types';
import { Invitation, Member, Organization } from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';

@Hook()
@Injectable()
export class OrganizationHook {
  private logger = new Logger(OrganizationHook.name);
  private organizationOwnerTupples(userId: string, organizationId: string) {
    return [
      // Make the creator an admin of the organization
      {
        user: `user:${userId}`,
        relation: 'admin',
        object: `organization:${organizationId}`,
      },
      // Grant owner permissions (highest level)
      {
        user: `user:${userId}`,
        relation: 'owner',
        object: `organization:${organizationId}`,
      },
      // Grant member access as well
      {
        user: `user:${userId}`,
        relation: 'member',
        object: `organization:${organizationId}`,
      },
    ];
  }
  private organizationMemberTupples(
    userId: string,
    organizationId: string,
    permisions: Array<string> = [],
  ) {
    const tuples = [
      // Grant member access as well
      {
        user: `user:${userId}`,
        relation: 'member',
        object: `organization:${organizationId}`,
      },
    ];
    // Grant other perisions supported in organization
    tuples.push(
      ...permisions.map((permision) => ({
        user: `user:${userId}`,
        relation: permision,
        object: `organization:${organizationId}`,
      })),
    );
    return tuples;
  }
  constructor(
    private readonly authzService: OpenFGAService,
    private readonly authnService: AuthService<BetterAuthWithPlugins>,
    private readonly prismaservice: PrismaService,
  ) {}

  private isErrorResponse(response: any): boolean {
    if (
      typeof response === 'object' &&
      response !== null &&
      'statusCode' in response
    ) {
      return true;
    }
    return false;
  }

  @AfterHook('/organization/create')
  async handleOrganizationCreated(ctx: AuthHookContext) {
    try {
      const response: any = ctx.context.returned;
      const organizationId: string = response?.id;
      const session = await this.authnService.api.getSession({
        headers: ctx.headers!,
      });
      const { user } = session ?? {};

      // Debug logging to understand the context structure
      this.logger.debug(
        'Hook context:',
        JSON.stringify(
          {
            session,
            body: ctx.context.body,
            headers: ctx.context.headers,
            returned: ctx.context.returned,
          },
          null,
          2,
        ),
      );
      if (!organizationId) {
        this.logger.error('Organization ID not found in response');
        return;
      }

      if (!user) {
        this.logger.error('Unauthorized. User not found in context.');
        return;
      }

      this.logger.log(
        `Organization ${organizationId} created successfully, creating "admin", "owner" and "member" relationship tuples for user ${user.id}`,
      );

      await this.authzService.write({
        writes: this.organizationOwnerTupples(user.id, organizationId),
      });

      this.logger.log(
        `Successfully created authorization tuples for organization ${organizationId} and user ${user.id}`,
      );
    } catch (error) {
      this.logger.error('Error in handleOrganizationCreated hook:', error);
      // Don't throw the error to avoid breaking the organization creation flow
      // but log it for debugging
    }
  }

  @BeforeHook('/organization/create')
  async beforeOrganizationCreate(ctx: AuthHookContext) {
    // Optional: Add validation or preprocessing before organization creation
    const session = await this.authnService.api.getSession({
      headers: ctx.headers!,
    });
    this.logger.debug('Before organization create - context:', {
      session,
      body: ctx.context.body,
      headers: Object.keys(ctx.context.headers || {}),
    });
  }

  @AfterHook('/organization/delete')
  async handleOrganizationDeleted(ctx: AuthHookContext) {
    try {
      const session = await this.authnService.api.getSession({
        headers: ctx.headers!,
      });
      const { user } = session ?? {};
      const response = ctx.context.returned as Organization | HttpExceptionBody;
      // Check if response is an error object (HttpExceptionBody) by checking for 'statusCode'
      if (this.isErrorResponse(response)) {
        // If deletion failed, log the error and skip cleanup
        this.logger.warn(
          'Organization delete failed with status ' +
            (response as HttpExceptionBody).statusCode +
            '.Skipping authorization cleanup',
        );
        return;
      }
      const organizationId: string = (response as any).id;
      if (!user) {
        this.logger.warn(
          'User not found in session context. Skipping authorization cleanup for organization deletion.',
        );
        return;
      }
      this.logger.log(
        `Organization ${organizationId} deleted, cleaning up authorization relationship tuples`,
      );

      await this.authzService.write({
        deletes: this.organizationOwnerTupples(user.id, organizationId),
      });
      this.logger.log(
        `Authorization cleanup done for organization ${organizationId}`,
      );
    } catch (error) {
      this.logger.error('Error in handleOrganizationDeleted hook:', error);
    }
  }

  @AfterHook('/organization/accept-invitation')
  async handleMemberAdded(ctx: AuthHookContext) {
    try {
      const response: any = ctx.context.returned;
      if (this.isErrorResponse(response)) {
        this.logger.error('Erro accepting organization membership invitation.');
        return;
      }
      const { member, invitation }: { invitation: Invitation; member: Member } =
        response;

      //   Update member relations using invitation
      const _member = await this.prismaservice.member.update({
        where: { id: member.id },
        data: { memberRelations: invitation.memberRelations },
      });
      this.logger.log(
        `Adding member ${member.userId} to organization ${_member.organizationId} with role ${member.role}`,
      );
      (ctx.context.returned as any)['member'] = _member;

      await this.authzService.write({
        writes: this.organizationMemberTupples(
          member.userId,
          member.organizationId,
          _member.memberRelations,
        ),
      });

      this.logger.log(
        `Successfully added relations ${member.memberRelations.join(', ')} for user ${member.userId}`,
      );
    } catch (error) {
      this.logger.error('Error in handleMemberAdded hook:', error);
    }
  }

  @AfterHook('/organization/remove-member')
  async handleMemberRemoved(ctx: AuthHookContext) {
    try {
      const response: any = ctx.context.returned;
      if (this.isErrorResponse(response)) {
        this.logger.error('Error leaving organization membership.');
        return;
      }

      const { member }: { member: Member } = response;

      this.logger.log(
        `Removing member ${member.userId} from organization ${member.organizationId}`,
      );

      await this.authzService.write({
        deletes:
          member.role === 'owner'
            ? this.organizationOwnerTupples(
                member.userId,
                member.organizationId,
              )
            : this.organizationMemberTupples(
                member.userId,
                member.organizationId,
                member.memberRelations,
              ),
      });

      this.logger.log(
        `Cleaned up authz relation tuples for user: ${member.userId}`,
      );
    } catch (error) {
      this.logger.error('Error in handleMemberRemoved hook:', error);
    }
  }
  @AfterHook('/organization/leave')
  async handleLeftGroup(ctx: AuthHookContext) {
    try {
      const response: any = ctx.context.returned;
      if (this.isErrorResponse(response)) {
        this.logger.error('Error leaving organization membership.');
        return;
      }

      const data: Member = response;

      this.logger.log(
        `Member ${data.userId} leaving organization ${data.organizationId}`,
      );

      await this.authzService.write({
        deletes:
          data.role === 'owner'
            ? this.organizationOwnerTupples(data.userId, data.organizationId)
            : this.organizationMemberTupples(
                data.userId,
                data.organizationId,
                data.memberRelations,
              ),
      });

      this.logger.log(
        `Cleaned up authz relation tuples for user: ${data.userId}`,
      );
    } catch (error) {
      this.logger.error('Error in handleMemberRemoved hook:', error);
    }
  }
}
