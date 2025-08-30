import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ClientGrpcProxy } from '@nestjs/microservices';
import { REGISTRY_PACKAGE } from '../constants';
import {
  QueryServicesRequest,
  REGISTRY_SERVICE_NAME,
  RegistryClient,
} from '../types';

@Injectable()
export class HiveDiscoveryService implements OnModuleInit, OnModuleDestroy {
  private registryService: RegistryClient;

  constructor(
    @Inject(REGISTRY_PACKAGE.V1.TOKEN)
    private client: ClientGrpcProxy,
  ) {}
  onModuleDestroy() {
    this.client.close();
  }
  onModuleInit() {
    this.registryService = this.client.getService<RegistryClient>(
      REGISTRY_SERVICE_NAME,
    );
  }

  getRegistryService(): RegistryClient {
    return this.registryService;
  }

  discoverServices(query: QueryServicesRequest) {
    return this.registryService.listServices(query);
  }

  findService(query: QueryServicesRequest) {
    return this.registryService.getService(query);
  }

  watchServices() {
    return this.registryService.watchServices({});
  }
}
