import { Inject, Injectable, Type } from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { HIVE_SERVICE_METADATA_KEY } from '../constants';
import { HiveServiceConfig } from '../interfaces';
import { RegistryClientService } from './registry-client.service';
import { HiveServiceClient } from './hive-service-client.service';

@Injectable()
export class HiveServiceFactory {
  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly reflector: Reflector,
  ) {}

  /**
   * Create a service client instance
   */
  async createServiceClient<T>(serviceClass: Type<T>): Promise<T> {
    const config = this.reflector.get<HiveServiceConfig>(
      HIVE_SERVICE_METADATA_KEY,
      serviceClass,
    );

    if (!config) {
      throw new Error(
        `No HiveService configuration found for ${serviceClass.name}`,
      );
    }

    // Create HiveServiceClient with the specific config
    const registryClient = await this.moduleRef.get(RegistryClientService);
    const hiveServiceClient = new HiveServiceClient(config, registryClient);

    // Initialize the client
    await hiveServiceClient.onModuleInit();

    // Create the service instance
    return new serviceClass(hiveServiceClient) as T;
  }
}
