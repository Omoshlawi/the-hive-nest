import { Reflector } from '@nestjs/core';
import { adminPluginAcl, organizationPluginAcl } from './auth.acl';
import { SetMetadata } from '@nestjs/common';
import { REQUIRE_ACTIVE_ORGANIZATION_KEY } from './auth.contants';

export const RequireSystemPermission =
  Reflector.createDecorator<
    Partial<Parameters<(typeof adminPluginAcl)['newRole']>[0]>
  >();
export const RequireOrganizationPermission =
  Reflector.createDecorator<
    Partial<Parameters<(typeof organizationPluginAcl)['newRole']>[0]>
  >();

export const RequireActiveOrganization = (requireActiveTeam: boolean = false) =>
  SetMetadata(REQUIRE_ACTIVE_ORGANIZATION_KEY, {
    organization: true,
    team: requireActiveTeam,
  });
