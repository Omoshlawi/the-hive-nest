import { createAccessControl } from 'better-auth/plugins/access';
import {
  adminAc,
  userAc,
  defaultStatements as defaultAdminStatements,
  defaultRoles as adminDefaultRoles,
} from 'better-auth/plugins/admin/access';
import {
  defaultStatements as defaultOrganizationStatements,
  memberAc,
  adminAc as organizationAdminAc,
  ownerAc,
  defaultRoles as organizationDefaultRoles,
} from 'better-auth/plugins/organization/access';

export const adminPluginAcl = createAccessControl({
  ...defaultAdminStatements,
  category: ['create', 'list', 'update', 'delete'],
  amenity: ['create', 'list', 'update', 'delete'],
  attributeType: ['create', 'list', 'update', 'delete'],
  fileUsageScope: ['create', 'list', 'update', 'delete'],
  fileUsageRule: ['create', 'list', 'update', 'delete'],
});

const adminRole = adminPluginAcl.newRole({
  category: ['create', 'delete', 'list', 'update'],
  amenity: ['create', 'delete', 'list', 'update'],
  attributeType: ['create', 'delete', 'list', 'update'],
  fileUsageScope: ['create', 'delete', 'list', 'update'],
  fileUsageRule: ['create', 'delete', 'list', 'update'],
  ...adminAc.statements,
});

const userRole = adminPluginAcl.newRole({
  category: ['list'],
  amenity: ['list'],
  attributeType: ['list'],
  fileUsageScope: ['list'],
  fileUsageRule: ['list'],
  ...userAc.statements,
});

export const organizationPluginAcl = createAccessControl({
  ...defaultOrganizationStatements,
  file: ['upload', 'delete', 'list'],
  property: ['create', 'read', 'update', 'delete'],
  listing: ['create', 'read', 'update', 'delete'],
});

const organizationAdminRole = organizationPluginAcl.newRole({
  file: ['delete', 'list', 'upload'],
  property: ['create', 'read', 'update', 'delete'],
  listing: ['create', 'read', 'update', 'delete'],
  ...organizationAdminAc.statements,
});

const organizationOwnerRole = organizationPluginAcl.newRole({
  file: ['delete', 'list', 'upload'],
  property: ['create', 'read', 'update', 'delete'],
  listing: ['create', 'read', 'update', 'delete'],
  ...ownerAc.statements,
});

const organizationMemberRole = organizationPluginAcl.newRole({
  file: ['list'],
  property: [],
  listing: ['read'],
  ...memberAc.statements,
});

export const adminPluginRoles = {
  ...adminDefaultRoles,
  admin: adminRole,
  user: userRole,
};

export const organizationPluginRoles = {
  ...organizationDefaultRoles,
  admin: organizationAdminRole,
  owner: organizationOwnerRole,
  member: organizationMemberRole,
};
