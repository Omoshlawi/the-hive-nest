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

/**
 * Thin wrapper around the gRPC stub for `registry-service`.
 *
 * Provides the three discovery operations used by the rest of the client
 * package: querying registered services, fetching a single service, and
 * streaming live updates. All domain code should go through this service
 * rather than accessing the gRPC stub directly.
 */
@Injectable()
export class HiveDiscoveryService implements OnModuleInit, OnModuleDestroy {
  private registryService: RegistryClient;

  constructor(
    @Inject(REGISTRY_PACKAGE.V1.TOKEN)
    private client: ClientGrpcProxy,
  ) {}

  onModuleInit(): void {
    this.registryService = this.client.getService<RegistryClient>(
      REGISTRY_SERVICE_NAME,
    );
  }

  onModuleDestroy(): void {
    this.client.close();
  }

  /** Exposes the raw gRPC stub for callers that need direct access (e.g. heartbeat). */
  getRegistryService(): RegistryClient {
    return this.registryService;
  }

  /**
   * Returns a pageable list of services that match the given query criteria
   * (name, version, tags, metadata).
   */
  findServices(query: QueryServicesRequest): Observable<ListServicesResponse> {
    return this.registryService.listServices(query);
  }

  /**
   * Returns the single best-match service for the given query, selected by
   * the registry (typically the most recent healthy instance).
   */
  findService(query: QueryServicesRequest): Observable<ServiceRegistration> {
    return this.registryService.getService(query);
  }

  /**
   * Opens a long-lived server-streaming RPC that emits a `ServiceUpdate`
   * event each time a service is registered, updated, or removed.
   * `HiveServiceClient` subscribes to this stream to maintain its proxy pool.
   */
  watchServices(): Observable<ServiceUpdate> {
    return this.registryService.watchServices({});
  }
}
