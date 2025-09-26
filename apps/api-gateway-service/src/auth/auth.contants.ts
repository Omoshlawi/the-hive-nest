import {
  adminAcl,
  adminRoles,
  organizationAcl,
  organizationRoles,
} from './auth.acl';

export const organizationConfig = {
  ac: organizationAcl,
  roles: organizationRoles,
  teams: {
    enabled: true,
  },
  dynamicAccessControl: {
    enabled: true,
  },
} as const;

export const adminConfig = { ac: adminAcl, roles: adminRoles };
