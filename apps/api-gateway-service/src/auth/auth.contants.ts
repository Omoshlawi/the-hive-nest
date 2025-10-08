import {
  adminPluginAcl,
  adminPluginRoles,
  organizationPluginAcl,
  organizationPluginRoles,
} from './auth.acl';

export const organizationConfig = {
  ac: organizationPluginAcl,
  roles: organizationPluginRoles,
  teams: {
    enabled: true,
  },
  dynamicAccessControl: {
    enabled: true,
  },
} as const;

export const adminConfig = { ac: adminPluginAcl, roles: adminPluginRoles };
