import { HiveService, HiveServiceClient } from '@hive/registry';
import { Injectable, Logger } from '@nestjs/common';
import { HIVE_IDENTITY_SERVICE_NAME, IDENTITY_PACKAGE } from '../constants';
import { IDENTITY_SERVICE_NAME, IdentityClient, User } from '../types';
import { Observable } from 'rxjs';

@HiveService({
  name: HIVE_IDENTITY_SERVICE_NAME,
  package: IDENTITY_PACKAGE.V1.NAME,
  protoPath: IDENTITY_PACKAGE.V1.PROTO_PATH,
  metadata: {},
  tags: [],
  serviceName: IDENTITY_SERVICE_NAME,
})
@Injectable()
export class IdentityClientService {
  /** Logger instance for logging service activity */
  private readonly logger = new Logger(IdentityClientService.name);

  constructor(private readonly hiveServiceClient: HiveServiceClient) {}

  /**
   * Example method to call identity service
   */
  getUser(userId: string): Observable<User> {
    const identityService = this.hiveServiceClient.getService<IdentityClient>();
    if (!identityService) {
      throw new Error('No healthy identity service instances available');
    }
    try {
      return identityService.getUser({ id: userId });
    } catch (error) {
      this.logger.error(`Failed to get user ${userId}`, error);
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
