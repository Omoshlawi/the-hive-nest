import { BaseAuthorizationService, OpenFGAService } from '@hive/authorization';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FileAuthZService extends BaseAuthorizationService {
  constructor(authz: OpenFGAService) {
    super(authz);
  }

  private getFileObject(scopeId: string) {
    return `file:${scopeId}`;
  }

  canCreateFile(userId: string, organizationId: string) {
    this.logger.log(
      `Checking if user ${userId} can create a file in organization ${organizationId}`,
    );
    return this.check(
      this.getUserObject(userId),
      'can_create_files',
      this.getOrganizationObject(organizationId),
      {
        contextualTuples: this.getCurrentActiveOrganizationContextTuple(
          userId,
          organizationId,
        ),
      },
    );
  }

  canViewOrganizationFiles(userId: string, organizationId: string) {
    return this.check(
      this.getUserObject(userId),
      'can_view_files',
      this.getOrganizationObject(organizationId),
      {
        contextualTuples: this.getCurrentActiveOrganizationContextTuple(
          userId,
          organizationId,
        ),
      },
    );
  }
}
