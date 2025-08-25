import { ClassType } from '@hive/utils';
import {
  User as PUser,
  Member as PMember,
  Invitation as PInvitation,
  Organization as POrganization,
} from '../../generated/prisma';
import { Member, Organization, User, Invitation } from '@hive/identity';
export class IdentityMappersUtils {
  // Add your methods and properties here
  static mapMember(
    member: PMember & { organization?: POrganization; user?: PUser },
  ): Member {
    return {
      id: member.id,
      userId: member.userId,
      user: member.user ? IdentityMappersUtils.mapUser(member.user) : undefined,
      role: member.role,
      createdAt: member.createdAt.toISOString(),
      organizationId: member.organizationId,
      organization: member.organization
        ? IdentityMappersUtils.mapOrganization(member.organization)
        : undefined,
    };
  }

  static mapOrganization(
    organization: POrganization & {
      members?: Array<PMember>;
      invitations?: Array<PInvitation>;
    },
  ): Organization {
    return {
      id: organization.id,
      name: organization.name,
      createdAt: organization.createdAt.toISOString(),
      members: organization?.members?.map(IdentityMappersUtils.mapMember) ?? [],
      logo: organization.logo ?? undefined,
      slug: organization.slug ?? undefined,
      metadata: organization.metadata ?? undefined,
      invitations:
        organization.invitations?.map(IdentityMappersUtils.mapInvitation) ?? [],
    };
  }

  static mapInvitation(
    invitation: PInvitation & { organization: POrganization; user?: PUser },
  ): Invitation {
    return {
      id: invitation.id,
      organizationId: invitation.organizationId,
      organization: invitation.organization
        ? IdentityMappersUtils.mapOrganization(invitation.organization)
        : undefined,
      email: invitation.email,
      role: invitation.role ?? undefined,
      expiresAt: invitation.expiresAt.toISOString(),
      inviterId: invitation.inviterId,
      status: invitation.status,
      user: invitation.user
        ? IdentityMappersUtils.mapUser(invitation.user)
        : undefined,
    };
  }
  static mapUser(
    user: PUser & {
      members?: Array<PMember>;
      invitations?: Array<PInvitation>;
    },
  ): User {
    return {
      id: user.id,
      name: user.name || '',
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image || '',
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      username: user.username || '',
      displayUsername: user.displayUsername || '',
      isAnonymous: user.isAnonymous ?? false,
      role: user.role || '',
      banned: user.banned ?? false,
      banReason: user.banReason || '',
      banExpires: user.banExpires ? user.banExpires.toISOString() : '',
      members: user?.members?.map(IdentityMappersUtils.mapMember) ?? [],
      invitations:
        user?.invitations?.map(IdentityMappersUtils.mapInvitation) ?? [],
    };
  }
}
