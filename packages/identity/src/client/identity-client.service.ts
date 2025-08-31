import {
  BaseHiveService,
  HiveService,
  HiveServiceClient,
} from '@hive/registry';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { HIVE_IDENTITY_SERVICE_NAME, IDENTITY_PACKAGE } from '../constants';
import { IDENTITY_SERVICE_NAME, IdentityClient, User } from '../types';
import { Observable } from 'rxjs';

@Injectable()
@HiveService({
  name: HIVE_IDENTITY_SERVICE_NAME,
  package: IDENTITY_PACKAGE.V1.NAME,
  protoPath: IDENTITY_PACKAGE.V1.PROTO_PATH,
  metadata: {},
  tags: [],
  serviceName: IDENTITY_SERVICE_NAME,
})
export class HiveIdentityClientService extends BaseHiveService {
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

  async onModuleInit() {
    // Manually trigger HiveServiceClient lifecycle
    await this.hiveServiceClient.onModuleInit?.();
  }

  async onModuleDestroy() {
    // Cleanup
    await this.hiveServiceClient.onModuleDestroy?.();
  }
}
