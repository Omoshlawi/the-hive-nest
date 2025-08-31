import { Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { HiveServiceClient } from 'client';

export abstract class BaseHiveService implements OnModuleInit, OnModuleDestroy {
  protected readonly logger: Logger;

  constructor(protected readonly hiveServiceClient: HiveServiceClient) {
    this.logger = new Logger(this.constructor.name);
  }

  onModuleInit() {
    this.logger.debug('Initializing Hive service client');
    return this.hiveServiceClient.onModuleInit?.();
  }

  onModuleDestroy() {
    this.logger.debug('Destroying Hive service client');
    return this.hiveServiceClient.onModuleDestroy?.();
  }
}
