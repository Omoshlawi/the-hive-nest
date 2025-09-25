import { BaseAuthorizationService, OpenFGAService } from '@hive/authorization';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FileAuthZService extends BaseAuthorizationService {
  constructor(authZ: OpenFGAService) {
    super(authZ);
  }

  private getFileObject(fileId: string) {
    return `file:${fileId}`;
  }

  createOrganizationFileTupple(userId:string, organizationId:string){
    
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

  async listOrganizationUserViewableFileObjects(
    userId: string,
    organizationId: string,
  ) {
    this.logger.log(
      `Retreiving authorized files for user ${userId} on organzization ${organizationId}`,
    );

    const objects = await this.listObjects(
      this.getUserObject(userId),
      'can_view',
      'file',
      {
        contextualTuples: this.getCurrentActiveOrganizationContextTuple(
          userId,
          organizationId,
        ),
      },
    );
    this.logger.debug(`Retreived authorized files objects : ${objects}`);
    return objects;
  }

  async listUserFiles(userId: string) {
    this.logger.log(
      `Retrieving authorized files for user ${userId} (no organization context)`,
    );
    const objects = await this.listObjects(
      this.getUserObject(userId),
      'can_view',
      'file',
    );
    this.logger.debug(`Retrieved authorized file objects: ${objects}`);
    return objects;
  }
}
