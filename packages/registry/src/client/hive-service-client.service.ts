import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { HiveServiceConfig } from '../interfaces';
import { HiveDiscoveryService } from './hive-discovery.service';
import {
  ClientGrpcProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import {
  Endpoint,
  ServiceRegistration,
  ServiceUpdate,
  ServiceUpdate_UpdateType,
} from '../types';

@Injectable()
export class HiveServiceClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger: Logger = new Logger(HiveServiceClient.name);
  private serviceGrpcClientProxyPool: Map<string, ClientGrpcProxy> = new Map();
  constructor(
    private readonly config: HiveServiceConfig,
    private readonly discoveryService: HiveDiscoveryService,
  ) {}

  onModuleInit() {
    this.logger.debug('Setting up service stream processing');
    this.setupServiceWatcher();
  }

  private setupServiceWatcher() {
    this.discoveryService.watchServices().subscribe({
      next: (updateStream) => this.handleServiceUpdate(updateStream),
      error: (error) => {
        this.logger.error('Service watch stream error', error);
        // Implement reconnection logic here
      },
      complete: () => {
        this.logger.warn('Service watch stream completed unexpectedly');
      },
    });
  }

  private handleServiceUpdate(updateStream: ServiceUpdate) {
    this.logger.debug('Consuming service changes stream');
    const serviceName = this.formatServiceName(updateStream.service);
    const serviceId = updateStream.service?.id;

    // Only process relevant services with grpc tag
    if (!this.isRelevantService(updateStream.service) || !serviceId) {
      this.logger.debug(`Skipping processing service ${serviceName}`);
      return;
    }

    this.logger.debug(`Processing service ${serviceName}`);

    switch (updateStream.type) {
      case ServiceUpdate_UpdateType.REMOVED:
        this.removeServiceInstance(serviceId, serviceName);
        break;
      case ServiceUpdate_UpdateType.ADDED:
      case ServiceUpdate_UpdateType.UPDATED:
        this.addOrUpdateServiceInstance(
          updateStream.service!,
          serviceId,
          serviceName,
        );
        break;
    }
  }

  private formatServiceName(service?: ServiceRegistration): string {
    if (!service) return 'unknown';
    return `${service.name}@${service.version}(${service.id})`;
  }

  private isRelevantService(service?: ServiceRegistration): boolean {
    return !!(
      service &&
      this.config.name === service.name &&
      service.tags?.includes('grpc')
    );
  }

  private removeServiceInstance(serviceId: string, serviceName: string) {
    const instance = this.serviceGrpcClientProxyPool.get(serviceId);
    if (instance) {
      instance.close();
      this.serviceGrpcClientProxyPool.delete(serviceId);
      this.logger.log(
        `Service instance [${serviceName}] removed: connection cleared`,
      );
    }
  }

  private addOrUpdateServiceInstance(
    service: ServiceRegistration,
    serviceId: string,
    serviceName: string,
  ) {
    // Skip if connection already exists and is healthy
    const existingInstance = this.serviceGrpcClientProxyPool.get(serviceId);
    if (existingInstance) {
      this.logger.debug(
        `Service connection for [${serviceName}] already exists and is healthy, skipping`,
      );
      return;
    }

    const endpoint = service.endpoints?.find((end) => end.protocol === 'grpc');
    if (!endpoint) {
      this.logger.warn(`No GRPC endpoint found for service [${serviceName}]`);
      return;
    }

    try {
      const newClientProxy = this.createGrpcProxyClientForEndpoint(endpoint);
      this.serviceGrpcClientProxyPool.set(serviceId, newClientProxy);
      this.logger.log(
        `New client instance for [${serviceName}] established and cached`,
      );
    } catch (error) {
      this.logger.error(`Failed to create client for [${serviceName}]`, error);
    }
  }

  /**
   * Creates a GRPC proxy client for the given endpoint.
   * @param endpoint Service endpoint information
   * @returns GRPC proxy client
   */
  private createGrpcProxyClientForEndpoint(endpoint: Endpoint) {
    this.logger.debug(
      `Creating GRPC proxy client for endpoint ${endpoint.host}:${endpoint.port}`,
    );
    return ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: this.config.package,
        protoPath: this.config.protoPath,
        url: `${endpoint.host}:${endpoint.port}`,
      },
    });
  }

  /**
   * Get a service proxy with load balancing
   * @returns ClientGrpcProxy or null if no healthy instances
   */
  getServiceProxy(): ClientGrpcProxy | null {
    const healthyInstances = Array.from(
      this.serviceGrpcClientProxyPool.entries(),
    ).map(([id, instance]) => ({ id, instance }));

    if (healthyInstances.length === 0) {
      this.logger.warn(
        `No healthy instances available for service ${this.config.name}`,
      );
      return null;
    }

    // Simple round-robin load balancing
    const selectedIndex = Math.floor(Math.random() * healthyInstances.length);
    return healthyInstances[selectedIndex].instance;
  }

  /**
   * Get all available service proxies
   */
  getAllServiceProxies(): ClientGrpcProxy[] {
    return Array.from(this.serviceGrpcClientProxyPool.values()).map(
      (instance) => instance,
    );
  }

  /**
   * Load balances proxy using method getServiceProxy and retreive its client
   */
  getService<T extends Object>() {
    const proxy = this.getServiceProxy();
    if (!proxy) {
      return null;
    }
    return proxy.getService<T>(this.config.serviceName);
  }

  getconfig() {
    return this.config;
  }

  onModuleDestroy() {
    Array.from(this.serviceGrpcClientProxyPool.entries()).forEach(
      ([key, value]) => {
        value.close();
      },
    );
    this.serviceGrpcClientProxyPool.clear();
  }
}
