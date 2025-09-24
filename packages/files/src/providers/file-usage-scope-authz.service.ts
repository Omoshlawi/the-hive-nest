import { BaseAuthorizationService, OpenFGAService } from '@hive/authorization';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FileUsageAuthzService extends BaseAuthorizationService {
  constructor(authz: OpenFGAService) {
    super(authz);
  }

  private getUsageScopeObject(scopeId: string) {
    return `file_usage_scope:${scopeId}`;
  }
  private getUsageRuleObject(scopeId: string) {
    return `file_usage_scope:${scopeId}`;
  }

  listFileUsageScopeId() {
    return this.listObjects(
      this.getUserObject('*'),
      'can_view',
      this.getUsageScopeObject('*'),
    );
  }
  listFileUsageRuleId() {
    return this.listObjects(
      this.getUserObject('*'),
      'can_view',
      this.getUsageRuleObject('*'),
    );
  }

  canCreateFileUsageScope(userId: string) {
    this.logger.log(
      "Checking 'file_usage_scope' create permisions for user " + userId,
    );
    return this.isSuperUser(userId);
  }
  canCreateFileUsageRule(userId: string) {
    this.logger.log(
      "Checking 'file_usage_rule' create permisions for user " + userId,
    );
    return this.isSuperUser(userId);
  }
}
