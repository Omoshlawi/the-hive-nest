import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  ClientGrpcProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import { timer } from 'rxjs';
import { retry, tap } from 'rxjs/operators';
import { HiveServiceConfig } from '../interfaces';
import {
  Endpoint,
  ServiceRegistration,
  ServiceUpdate,
  ServiceUpdate_UpdateType,
} from '../types';
import { HiveDiscoveryService } from './hive-discovery.service';

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
    this.validateConfiguration();
    this.setupServiceWatcher();
  }

  private validateConfiguration() {
    const required = ['name', 'package', 'protoPath'];
    const missing = required.filter((field) => !this.config[field]);

    if (missing.length > 0) {
      const error = `Missing required configuration fields: ${missing.join(', ')}`;
      this.logger.error(error);
      throw new Error(error);
    }

    if (!this.config.serviceName) {
      this.logger.warn(
        `No serviceName provided for ${this.config.name}, using default naming`,
      );
    }
  }

  /**
   * Sets up a robust watcher for the service discovery stream.
   * This method  includes retry logic with exponential backoff
   * to handle transient connection failures gracefully.
   */
  private setupServiceWatcher() {
    try {
      this.discoveryService
        .watchServices()
        .pipe(
          // Use the `tap` operator to log messages before the retry attempt.
          tap({
            error: (err) =>
              this.logger.warn(
                `Service watch stream failed. Retrying connection...`,
                err,
              ),
          }),
          // The `retry` operator will resubscribe to the source Observable
          // on error. The `delay` function implements an exponential backoff.
          retry({
            delay: (error, retryCount) => {
              const delayMs = Math.pow(2, retryCount) * 1000;
              this.logger.log(
                `Attempt #${retryCount}: Retrying stream after ${delayMs / 1000}s...`,
              );
              return timer(delayMs);
            },
          }),
        )
        .subscribe({
          next: (updateStream) => this.handleServiceUpdate(updateStream),
          error: (error) => {
            this.logger.error(
              'Service watch stream failed after all retry attempts. The service client is now in a potentially unstable state.',
              error,
            );
            // Future-proof: Consider adding a mechanism here to alert a health check or a monitoring system.
          },
          complete: () => {
            this.logger.warn('Service watch stream completed unexpectedly');
            // Implement logic here to re-establish the connection if needed.
            // For now, the `retry` logic in the pipe handles this, but a full
            // shutdown/re-initialization might be necessary for certain scenarios.
          },
        });
    } catch (error) {
      // Catch any synchronous errors that might occur during the initial call.
      this.logger.error(
        'Failed to initialize the service watch stream.',
        error,
      );
    }
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
        // Support large file uploads (up to 100MB)
        // This is especially important for virtual tour service file streaming
        // maxSendMessageLength: 100 * 1024 * 1024, // 100MB
        // maxReceiveMessageLength: 100 * 1024 * 1024, // 100MB
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
    this.logger.log('Load balancing ' + this.config.name + ' client proxies');
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
