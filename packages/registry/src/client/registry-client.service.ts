import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientGrpcProxy } from '@nestjs/microservices';
import { Cron, CronExpression } from '@nestjs/schedule';
import { REGISTRY_PACKAGE } from '../constants';
import { REGISTRY_SERVICE_NAME, RegistryClient } from '../types';
import { RegistryClientConfig } from '../config';
import { PORT_TOKEN } from '@hive/common';

@Injectable()
export class RegistryClientService implements OnModuleInit {
  private registryService: RegistryClient;
  private instanceId: string;
  private readonly logger = new Logger(RegistryClientService.name);
  constructor(
    @Inject(REGISTRY_PACKAGE.V1.TOKEN) private client: ClientGrpcProxy,
    private config: RegistryClientConfig,
    @Inject(PORT_TOKEN) private port: number,
  ) {
    console.log('Config----->', config, port);
  }
  onModuleInit() {
    this.registryService = this.client.getService<RegistryClient>(
      REGISTRY_SERVICE_NAME,
    );
  }
  @Cron(CronExpression.EVERY_30_SECONDS)
  sendHeartbeat() {
    this.logger.debug('Sending Heart beat to registry service');
    if (!this.instanceId) {
      // TODO: Log aproprately

      return;
    }
    this.registryService.heartbeat({
      serviceId: this.instanceId,
    });
  }

  private getServiceDetails() {}
}
