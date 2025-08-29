import {
  BaseStorage,
  HeartbeatResponse,
  QueryServicesRequest,
  RegisterServiceDto,
  SendHeartbeatDto,
  ServiceHealthResponse,
  ServiceRegistration,
  ServiceStatus,
  ServiceUpdate,
  ServiceUpdate_UpdateType,
  ServiceUtils,
} from '@hive/registry';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { Observable, Subject } from 'rxjs';
import { AppConfig } from 'src/config/app.config';
import { RedisStorage } from 'src/storage/storage.redis.service';

@Injectable()
export class ServiceRegistryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ServiceRegistryService.name);
  private readonly serviceUpdates$ = new Subject<ServiceUpdate>();

  constructor(
    private readonly storage: BaseStorage,
    private readonly config: AppConfig,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  async onModuleInit() {
    await this.storage.initialize();
    this.logger.log('Registry service initialized');
    if (this.storage instanceof RedisStorage) {
      this.logger.debug('Listening for ttl events');
      this.storage.onServiceExpired((service) => {
        this.emitServiceUpdate(ServiceUpdate_UpdateType.REMOVED, service);
      });
    }
  }

  async onModuleDestroy() {
    await this.storage.close();
    this.logger.log('Registry service destroyed');
  }

  /**
   * Generate a unique instance ID
   */
  private async generateUniqueInstanceId(
    registerServiceDto: RegisterServiceDto,
    maxRetries = 5,
  ): Promise<string> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const instanceId = ServiceUtils.generateInstanceId(registerServiceDto);
      // Check if exists atomically
      const exists = await this.storage.get(instanceId);
      if (!exists) {
        return instanceId;
      }
      this.logger.warn(`ID collision on attempt ${attempt + 1}: ${instanceId}`);
    }

    throw new Error('Failed to generate unique instance ID after max retries');
  }

  getServiceUpdates(): Observable<ServiceUpdate> {
    return this.serviceUpdates$.asObservable();
  }

  private emitServiceUpdate(
    type: ServiceUpdate_UpdateType,
    service: ServiceRegistration,
  ) {
    this.logger.debug(
      `Emitting service update: ${type} -> ${service.name}@${service.version}`,
    );
    this.serviceUpdates$.next({ type, service });
  }

  async registerService(
    registerDto: RegisterServiceDto,
  ): Promise<ServiceRegistration> {
    const instanceId = await this.generateUniqueInstanceId(registerDto);

    const service = ServiceUtils.createRegistryServiceEntry(
      instanceId,
      registerDto,
    );

    const savedService = await this.storage.save(service);
    this.emitServiceUpdate(ServiceUpdate_UpdateType.ADDED, savedService);
    this.logger.log(
      `Service registered: ${savedService.name}@${savedService.version} ` +
        `with ID: ${savedService.id} at endpoints ${savedService.endpoints?.map((i) => `${i.protocol}${i.host}:${i.port}`).join(', ')}`,
    );

    return savedService;
  }
  async getService(
    query: QueryServicesRequest,
  ): Promise<ServiceRegistration | null> {
    this.logger.debug(
      `Getting service with query - name: ${query.name || 'any'}, ` +
        `version: ${query.version || 'any'}, ` +
        `tags: [${query.tags?.join(', ') || 'none'}], ` +
        `metadata keys: [${query.metadata ? Object.keys(query.metadata).join(', ') : 'none'}]`,
    );

    // Use the same filtering logic as listServices
    const services = await this.listServices(query);

    if (services.length === 0) {
      this.logger.warn(
        `No services found matching query - name: ${query.name || 'any'}, ` +
          `version: ${query.version || 'any'}, ` +
          `tags: [${query.tags?.join(', ') || 'none'}]`,
      );
      return null;
    }

    const { index, service } =
      ServiceUtils.loadBalanceAndFindOneService(services);

    this.logger.log(
      `Service selected: ${service.name}@${service.version} ` +
        `(ID: ${service.id})at endpoints ${service.endpoints?.map((i) => `${i.protocol}${i.host}:${i.port}`).join(', ')} ` +
        `- Load balanced selection ${index + 1}/${services.length} available instances`,
    );

    return service;
  }

  async listServices(
    query: QueryServicesRequest,
  ): Promise<Array<ServiceRegistration>> {
    const { tags, name, version, metadata } = query ?? {};

    this.logger.debug(
      `Listing services with filters - name: ${name || 'any'}, ` +
        `version: ${version || 'any'}, ` +
        `tags: [${tags?.join(', ') || 'none'}], ` +
        `metadata keys: [${metadata ? Object.keys(metadata).join(', ') : 'none'}]`,
    );

    const allServices = await this.storage.getAll();
    this.logger.debug(
      `Retrieved ${allServices.length} total services from storage`,
    );

    let filteredServices = ServiceUtils.filterServices(allServices, query);
    // Log final results with service details
    if (filteredServices.length > 0) {
      const servicesSummary = filteredServices
        .map((s) => `${s.name}@${s.version}(${s.id})`)
        .join(', ');

      this.logger.log(
        `Found ${filteredServices.length} service(s) matching criteria: ${servicesSummary}`,
      );
    } else {
      // Show available alternatives when no matches found
      if (allServices.length > 0) {
        const availableServices = [
          ...new Set(allServices.map((s) => `${s.name}@${s.version}`)),
        ];
        this.logger.warn(
          `No services found matching criteria. Available services: ${availableServices.join(', ')}`,
        );
      } else {
        this.logger.warn('No services found - registry is empty');
      }
    }

    return filteredServices;
  }

  async unregisterService(id: string): Promise<ServiceRegistration | null> {
    this.logger.debug(`Attempting to unregister service with ID: ${id}`);

    // First check if the service exists
    const existingService = await this.storage.get(id);
    if (!existingService) {
      this.logger.warn(`Service with ID ${id} not found for unregistration`);
      return null;
    }

    // Remove the service from storage
    const removedService = await this.storage.remove(id);

    if (removedService) {
      this.emitServiceUpdate(ServiceUpdate_UpdateType.REMOVED, removedService);

      this.logger.log(
        `Service unregistered: ${removedService.name}@${removedService.version} ` +
          `with ID: ${removedService.id} from endpoints ${removedService.endpoints?.map((i) => `${i.protocol}${i.host}:${i.port}`).join(', ')}`,
      );
    } else {
      this.logger.error(`Failed to remove service with ID: ${id} from storage`);
    }

    return removedService;
  }

  async healthCheck(): Promise<ServiceHealthResponse> {
    this.logger.debug('Performing health check');

    const isHealthy = await this.storage.healthCheck();
    const response = {
      status: isHealthy ? ServiceStatus.HEALTHY : ServiceStatus.UNHEALTHY,
      timestamp: Date.now().toString(),
      uptime: process.uptime(),
      storage: {
        type: this.storage.constructor.name,
        healthy: isHealthy,
      },
    };

    this.logger.log(
      `Health check completed - Status: ${response.status}, ` +
        `Storage: ${response.storage.type} (${response.storage.healthy ? 'healthy' : 'unhealthy'}), ` +
        `Uptime: ${Math.floor(response.uptime)}s`,
    );

    return response;
  }

  async heartbeat(
    heartbeat: SendHeartbeatDto,
  ): Promise<HeartbeatResponse | null> {
    this.logger.debug(
      `Processing heartbeat for service ID: ${heartbeat.serviceId}`,
    );

    const service = await this.storage.get(heartbeat.serviceId);
    if (!service) {
      this.logger.warn(
        `Heartbeat received for unknown service ID: ${heartbeat.serviceId}`,
      );
      return null;
    }

    const now = Date.now().toString();
    const previousTimestamp = service.timestamp;
    service.timestamp = now;
    service.metadata = heartbeat.metadata ?? {};
    service.endpoints =
      heartbeat.endpoints?.map((endpoint) => ({
        ...endpoint,
        metadata: endpoint.metadata ?? {},
        protocol: endpoint.protocol as any,
      })) ?? [];
    service.tags = heartbeat.tags ?? [];
    await this.storage.save(service);
    this.emitServiceUpdate(ServiceUpdate_UpdateType.UPDATED, service);

    this.logger.debug(
      `Heartbeat acknowledged for ${service.name}@${service.version} (${heartbeat.serviceId}) - ` +
        `Last seen: ${new Date(+previousTimestamp).toISOString()}, ` +
        `Updated: ${new Date(+now).toISOString()}`,
    );

    return {
      acknowledged: true,
      message: 'Heartbeat successful',
      service,
    };
  }

  @Cron(CronExpression.EVERY_MINUTE, { name: 'cleanupExpiredServices' })
  private async cleanupExpiredServices(): Promise<void> {
    this.logger.debug('Running cleanup of expired services...');

    if (this.storage instanceof RedisStorage) {
      this.logger.debug(
        'Redis Handles ttl internally hence skipping clean up and disabling cleanup task',
      );
      this.schedulerRegistry.deleteCronJob('cleanupExpiredServices');
      this.logger.debug('Cleanup task disabled');
      return;
    }
    try {
      const services = await this.storage.getAll();
      const serviceTtl = this.config.serviceTtl;

      const expiredIds = ServiceUtils.expiredServiceIds(services, serviceTtl);

      if (expiredIds.length > 0) {
        this.logger.warn(`Cleaning up ${expiredIds.length} expired services`);

        // Remove in batches to avoid overwhelming storage
        const batchSize = 10;
        for (let i = 0; i < expiredIds.length; i += batchSize) {
          const batch = expiredIds.slice(i, i + batchSize);
          await Promise.allSettled(
            batch.map(async (id) => {
              const removedService = await this.storage.remove(id);
              if (!removedService) return;
              // Emite those removed through timeout
              this.emitServiceUpdate(
                ServiceUpdate_UpdateType.REMOVED,
                removedService,
              );
              return removedService;
            }),
          );
        }
      }
    } catch (error) {
      this.logger.error(`Cleanup failed: ${error.message}`);
    }
  }

}
