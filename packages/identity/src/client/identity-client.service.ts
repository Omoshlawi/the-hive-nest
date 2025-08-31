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
export class HiveIdentityClientService
  implements OnModuleInit, OnModuleDestroy
{
  protected readonly logger: Logger;

  constructor(protected readonly hiveServiceClient: HiveServiceClient) {
    this.logger = new Logger(this.constructor.name);
  }

  onModuleInit() {
    this.logger.debug('Initializing Hive service client');
    this.hiveServiceClient.onModuleInit?.();
  }

  onModuleDestroy() {
    this.logger.debug('Destroying Hive service client');
    return this.hiveServiceClient.onModuleDestroy?.();
  }
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
