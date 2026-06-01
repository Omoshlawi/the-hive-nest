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

/**
 * Manages the live gRPC client proxy pool for a single named remote service.
 *
 * On startup it subscribes to the registry's service-update stream and
 * maintains one `ClientGrpcProxy` per healthy remote endpoint (keyed by
 * service instance ID). When the registry reports a service as removed the
 * corresponding proxy is closed and evicted.
 *
 * Use `getService<T>()` when you want a nullable result, or
 * `loadBalance<T>()` when you expect the service to be available and want a
 * throw on absence (preferred in domain client packages).
 *
 * Lifecycle: instantiated by `HiveServiceModule.forFeature()` — one instance
 * per `@HiveService`-decorated client class.
 */
@Injectable()
export class HiveServiceClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger: Logger = new Logger(HiveServiceClient.name);
  /** Live proxy pool: serviceInstanceId → ClientGrpcProxy */
  private grpcProxies: Map<string, ClientGrpcProxy> = new Map();

  constructor(
    private readonly config: HiveServiceConfig,
    private readonly discoveryService: HiveDiscoveryService,
  ) {}

  onModuleInit(): void {
    this.logger.debug('Setting up service stream processing');
    this.validateConfiguration();
    this.initServiceWatcher();
  }

  private validateConfiguration(): void {
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
   * Subscribes to the registry discovery stream with exponential-backoff
   * retry so transient network failures are handled automatically.
   * Drives `handleServiceUpdate` on each registry event.
   */
  private initServiceWatcher(): void {
    try {
      this.discoveryService
        .watchServices()
        .pipe(
          tap({
            error: (err) =>
              this.logger.warn(
                `Service watch stream failed. Retrying connection...`,
                err,
              ),
          }),
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
          next: (update) => this.handleServiceUpdate(update),
          error: (error) => {
            this.logger.error(
              'Service watch stream failed after all retry attempts. ' +
                'The service client is now in a potentially unstable state.',
              error,
            );
          },
          complete: () => {
            this.logger.warn('Service watch stream completed unexpectedly');
          },
        });
    } catch (error) {
      this.logger.error(
        'Failed to initialize the service watch stream.',
        error,
      );
    }
  }

  /** Routes a registry update event to add, remove, or skip a proxy. */
  private handleServiceUpdate(update: ServiceUpdate) {
    this.logger.debug('Consuming service changes stream');
    const label = this.formatServiceLabel(update.service);
    const serviceId = update.service?.id;

    if (!this.matchesClient(update.service) || !serviceId) {
      this.logger.debug(`Skipping service ${label}`);
      return;
    }

    this.logger.debug(`Processing service ${label}`);

    switch (update.type) {
      case ServiceUpdate_UpdateType.REMOVED:
        this.removeServiceProxy(serviceId, label);
        break;
      case ServiceUpdate_UpdateType.ADDED:
      case ServiceUpdate_UpdateType.UPDATED:
        this.ensureServiceProxy(update.service!, serviceId, label);
        break;
    }
  }

  /** Returns a human-readable label used in log messages. */
  private formatServiceLabel(service?: ServiceRegistration): string {
    if (!service) return 'unknown';
    return `${service.name}@${service.version}(${service.id})`;
  }

  /**
   * Returns true when the registry event is for the service this client
   * is configured to connect to, and the instance advertises a gRPC endpoint.
   */
  private matchesClient(service?: ServiceRegistration): boolean {
    return !!(
      service &&
      this.config.name === service.name &&
      service.tags?.includes('grpc')
    );
  }

  /** Closes and removes the proxy for a service instance that left the registry. */
  private removeServiceProxy(serviceId: string, label: string) {
    const instance = this.grpcProxies.get(serviceId);
    if (instance) {
      instance.close();
      this.grpcProxies.delete(serviceId);
      this.logger.log(
        `Service instance [${label}] removed: connection cleared`,
      );
    }
  }

  /**
   * Adds a gRPC proxy for a new service instance. No-ops if a proxy for
   * this instance ID already exists (update events are idempotent).
   */
  private ensureServiceProxy(
    service: ServiceRegistration,
    serviceId: string,
    label: string,
  ) {
    if (this.grpcProxies.has(serviceId)) {
      this.logger.debug(
        `Proxy for [${label}] already exists and is healthy, skipping`,
      );
      return;
    }

    const endpoint = service.endpoints?.find((end) => end.protocol === 'grpc');
    if (!endpoint) {
      this.logger.warn(`No gRPC endpoint found for service [${label}]`);
      return;
    }

    try {
      const proxy = this.createGrpcProxy(endpoint);
      this.grpcProxies.set(serviceId, proxy);
      this.logger.log(`New proxy for [${label}] established and cached`);
    } catch (error) {
      this.logger.error(`Failed to create proxy for [${label}]`, error);
    }
  }

  /**
   * Constructs a `ClientGrpcProxy` pointed at the given endpoint using the
   * package and proto path from this client's `HiveServiceConfig`.
   */
  private createGrpcProxy(endpoint: Endpoint): ClientGrpcProxy {
    this.logger.debug(
      `Creating gRPC proxy for endpoint ${endpoint.host}:${endpoint.port}`,
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
   * Selects one healthy proxy at random (simple random load balancing).
   * Returns `null` if the proxy pool is empty — the service may not have
   * registered yet or all instances may have left.
   */
  getServiceProxy(): ClientGrpcProxy | null {
    const proxies = Array.from(this.grpcProxies.entries()).map(
      ([id, instance]) => ({ id, instance }),
    );

    if (proxies.length === 0) {
      this.logger.warn(
        `No healthy instances available for service ${this.config.name}`,
      );
      return null;
    }

    this.logger.log('Load balancing ' + this.config.name + ' client proxies');
    const selected = Math.floor(Math.random() * proxies.length);
    return proxies[selected].instance;
  }

  /** Returns all live proxies (useful for health checks). */
  getAllServiceProxies(): ClientGrpcProxy[] {
    return Array.from(this.grpcProxies.values());
  }

  /**
   * Returns a typed gRPC service stub via a randomly selected proxy, or
   * `null` if no healthy instances are available.
   *
   * Prefer `loadBalance<T>()` in production code — it throws on absence
   * which surfaces misconfiguration early rather than silently returning null.
   */
  getService<T extends object>(): T | null {
    const proxy = this.getServiceProxy();
    if (!proxy) return null;
    return proxy.getService<T>(this.config.serviceName);
  }

  /**
   * Returns a typed gRPC service stub or throws if no healthy instance is
   * available. Use this in domain client packages (`@hive/property`,
   * `@hive/files`, etc.) instead of implementing the null-check locally.
   *
   * @throws Error when the proxy pool is empty (service not yet registered
   *   or all instances have deregistered).
   */
  loadBalance<T extends object>(): T {
    const service = this.getService<T>();
    if (!service) {
      throw new Error(
        `No healthy service instance available for "${this.config.name}". ` +
          `Ensure the service is running and registered with the registry.`,
      );
    }
    return service;
  }

  /** Returns the resolved configuration for this client. */
  getConfig(): HiveServiceConfig {
    return this.config;
  }

  onModuleDestroy() {
    this.grpcProxies.forEach((proxy) => proxy.close());
    this.grpcProxies.clear();
  }
}
