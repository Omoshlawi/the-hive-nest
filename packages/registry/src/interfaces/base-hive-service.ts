import { Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { HiveServiceClient } from 'client';

export abstract class BaseHiveService implements OnModuleInit, OnModuleDestroy {
  protected readonly logger: Logger;

  constructor(protected readonly hiveServiceClient: HiveServiceClient) {
    this.logger = new Logger(this.constructor.name);
  }

  async onModuleInit() {
    this.logger.debug('Initializing Hive service client');
    await this.hiveServiceClient.onModuleInit?.();
  }

  async onModuleDestroy() {
    this.logger.debug('Destroying Hive service client');
    await this.hiveServiceClient.onModuleDestroy?.();
  }
}
