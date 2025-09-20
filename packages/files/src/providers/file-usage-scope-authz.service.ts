import { BaseAuthorizationService } from '@hive/authorization';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FileUsageScopeAuthzService extends BaseAuthorizationService {
  protected servicePrefix: string = 'file_usage_scope';

  
}
