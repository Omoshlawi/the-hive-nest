import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ClientGrpcProxy } from '@nestjs/microservices';
import { REGISTRY_PACKAGE } from '../constants';
import {
  ListServicesResponse,
  QueryServicesRequest,
  REGISTRY_SERVICE_NAME,
  RegistryClient,
  ServiceRegistration,
  ServiceUpdate,
} from '../types';
import { Observable } from 'rxjs';

@Injectable()
export class HiveDiscoveryService implements OnModuleInit, OnModuleDestroy {
  private registryService: RegistryClient;

  constructor(
    @Inject(REGISTRY_PACKAGE.V1.TOKEN)
    private client: ClientGrpcProxy,
  ) {}
  onModuleDestroy(): void {
    this.client.close();
  }
  onModuleInit(): void {
    this.registryService = this.client.getService<RegistryClient>(
      REGISTRY_SERVICE_NAME,
    );
  }

  getRegistryService(): RegistryClient {
    return this.registryService;
  }

  discoverServices(
    query: QueryServicesRequest,
  ): Observable<ListServicesResponse> {
    return this.registryService.listServices(query);
  }

  findService(query: QueryServicesRequest): Observable<ServiceRegistration> {
    return this.registryService.getService(query);
  }

  watchServices(): Observable<ServiceUpdate> {
    return this.registryService.watchServices({});
  }
}
