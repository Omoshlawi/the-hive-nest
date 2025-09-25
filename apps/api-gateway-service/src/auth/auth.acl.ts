import { createAccessControl } from 'better-auth/plugins/access';
import {
  adminAc,
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

export const adminAcl = createAccessControl({
  ...defaultAdminStatements,
  category: ['create', 'list', 'update', 'delete'],
  amenity: ['create', 'list', 'update', 'delete'],
  attributeType: ['create', 'list', 'update', 'delete'],
  fileUsageScope: ['create', 'list', 'update', 'delete'],
  fileUsageRule: ['create', 'list', 'update', 'delete'],
});

const adminRole = adminAcl.newRole({
  category: ['create', 'delete', 'list', 'update'],
  amenity: ['create', 'delete', 'list', 'update'],
  attributeType: ['create', 'delete', 'list', 'update'],
  fileUsageScope: ['create', 'delete', 'list', 'update'],
  fileUsageRule: ['create', 'delete', 'list', 'update'],
  ...adminAc.statements,
});

const userRole = adminAcl.newRole({
  category: ['list'],
  amenity: ['list'],
  attributeType: ['list'],
  fileUsageScope: ['list'],
  fileUsageRule: ['list'],
  ...adminAc.statements,
});

export const organizationAcl = createAccessControl({
  ...defaultOrganizationStatements,
  file: ['upload', 'delete', 'list'],
  property: ['create', 'read', 'update', 'delete'],
  listing: ['create', 'read', 'update', 'delete'],
});

const organizationAdminRole = organizationAcl.newRole({
  file: ['delete', 'list', 'upload'],
  property: ['create', 'read', 'update', 'delete'],
  listing: ['create', 'read', 'update', 'delete'],
  ...organizationAdminAc.statements,
});

const organizationOwnerRole = organizationAcl.newRole({
  file: ['delete', 'list', 'upload'],
  property: ['create', 'read', 'update', 'delete'],
  listing: ['create', 'read', 'update', 'delete'],
  ...ownerAc.statements,
});

const organizationMemberRole = organizationAcl.newRole({
  file: ['list'],
  property: ['read'],
  listing: ['read'],
  ...memberAc.statements,
});

export const adminRoles = {
  ...adminDefaultRoles,
  admin: adminRole,
  user: userRole,
};

export const organizationRoles = {
  ...organizationDefaultRoles,
  admin: organizationAdminRole,
  owner: organizationOwnerRole,
  member: organizationMemberRole,
};
