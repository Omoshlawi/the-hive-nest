import {
  BaseStorage,
  GetServiceDto,
  HeartbeatResponse,
  ListServicesDto,
  RegisterServiceDto,
  SendHeartbeatDto,
  ServiceHealthResponse,
  ServiceRegistration,
  ServiceStatus,
} from '@hive/registry';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import semver from 'semver';
import { AppConfig } from 'src/config/app.config';
import { RedisStorage } from 'src/storage/storage.redis.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ServiceRegistryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ServiceRegistryService.name);

  constructor(
    private readonly storage: BaseStorage,
    private readonly config: AppConfig,
  ) {}

  async onModuleInit() {
    await this.storage.initialize();
    this.logger.log('Registry service initialized');
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
      const servicePart =
        registerServiceDto.name?.replace(/[/]/g, '-')?.replace(/[@]/g, '') ||
        'unknown';
      const hostPart =
        registerServiceDto.host?.replace(/[^a-zA-Z0-9]/g, '-') || 'unknown';
      const portPart = registerServiceDto.port || 'unknown';
      const uuid = uuidv4();

      const instanceId = `${servicePart}-${hostPart}-${portPart}-${uuid}`;

      // Check if exists atomically
      const exists = await this.storage.get(instanceId);
      if (!exists) {
        return instanceId;
      }

      this.logger.warn(`ID collision on attempt ${attempt + 1}: ${instanceId}`);
    }

    throw new Error('Failed to generate unique instance ID after max retries');
  }

  async registerService(
    registerDto: RegisterServiceDto,
  ): Promise<ServiceRegistration> {
    const instanceId = await this.generateUniqueInstanceId(registerDto);

    const service: ServiceRegistration = {
      ...registerDto,
      id: instanceId,
      timestamp: Date.now().toString(),
      metadata: registerDto.metadata ?? {},
    };

    const savedService = await this.storage.save(service);

    this.logger.log(
      `Service registered: ${savedService.name}@${savedService.version} ` +
        `with ID: ${savedService.id} at ${savedService.host}:${savedService.port}`,
    );

    return savedService;
  }

  async getService({
    name: serviceName,
    version,
  }: GetServiceDto): Promise<ServiceRegistration | null> {
    // TODO: Use Health info when finding a service
    const allServices = await this.storage.getAll();
    const services = allServices.filter((entry) =>
      this.matchesPattern(entry.name, serviceName),
    );

    // Filter by version using semver
    const matchingServices = services.filter((service) => {
      return this.matchesVersion(service.version, version);
    });

    if (matchingServices.length === 0) {
      this.logger.warn(
        `No services found for ${serviceName}@${version}. Available versions: ${services
          .map((s) => s.version)
          .join(', ')}`,
      );
      return null;
    }

    // Load balance by random selection
    const randomIndex = Math.floor(Math.random() * matchingServices.length);
    const selectedService = matchingServices[randomIndex];

    this.logger.debug(
      `Load balanced ${serviceName}@${version}: selected ${selectedService.id} ` +
        `(${randomIndex + 1}/${matchingServices.length} instances)`,
    );

    return selectedService;
  }

  async listServices({
    tags,
    name,
    version,
  }: ListServicesDto): Promise<Array<ServiceRegistration>> {
    this.logger.debug(
      `Listing services with filters - name: ${name || 'all'}, ` +
        `version: ${version || 'all'}, tags: ${tags?.join(', ') || 'none'}`,
    );

    const allServices = await this.storage.getAll();
    let filteredServices = allServices;

    // Filter by name pattern if provided
    if (name) {
      filteredServices = filteredServices.filter((service) =>
        this.matchesPattern(service.name, name),
      );
      this.logger.debug(
        `After name filter: ${filteredServices.length} services`,
      );
    }

    // Filter by version if provided
    if (version) {
      filteredServices = filteredServices.filter((service) =>
        this.matchesVersion(service.version, version),
      );
      this.logger.debug(
        `After version filter: ${filteredServices.length} services`,
      );
    }

    // Filter by tags if provided
    if (tags && tags.length > 0) {
      filteredServices = filteredServices.filter((service) => {
        // Check if service has all required tags
        const serviceTags = service.tags || [];
        return tags.every((tag) => serviceTags.includes(tag));
      });
      this.logger.debug(
        `After tags filter: ${filteredServices.length} services`,
      );
    }

    this.logger.log(
      `Listed ${filteredServices.length} services matching criteria: ` +
        `name=${name || 'any'}, version=${version || 'any'}, ` +
        `tags=[${tags?.join(', ') || 'none'}]`,
    );

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
      this.logger.log(
        `Service unregistered: ${removedService.name}@${removedService.version} ` +
          `with ID: ${removedService.id} from ${removedService.host}:${removedService.port}`,
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

  async heartbeat({
    serviceId,
  }: SendHeartbeatDto): Promise<HeartbeatResponse | null> {
    this.logger.debug(`Processing heartbeat for service ID: ${serviceId}`);

    const service = await this.storage.get(serviceId);
    if (!service) {
      this.logger.warn(
        `Heartbeat received for unknown service ID: ${serviceId}`,
      );
      return null;
    }

    const now = Date.now().toString();
    const previousTimestamp = service.timestamp;
    service.timestamp = now;

    await this.storage.save(service);

    this.logger.debug(
      `Heartbeat acknowledged for ${service.name}@${service.version} (${serviceId}) - ` +
        `Last seen: ${new Date(+previousTimestamp).toISOString()}, ` +
        `Updated: ${new Date(+now).toISOString()}`,
    );

    return {
      acknowledged: true,
      message: 'Heartbeat successful',
      service,
    };
  }

  private matchesPattern(serviceName: string, pattern: string): boolean {
    // Support wildcards like @hive/* or exact matches
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      return serviceName.startsWith(prefix);
    }
    return serviceName === pattern;
  }
  // @Cron(CronExpression.EVERY_MINUTE)
  private async cleanupExpiredServices(): Promise<void> {
    this.logger.debug('Running cleanup of expired services...');

    if (this.storage instanceof RedisStorage) {
      this.logger.debug('Redis Handles ttl internally hence skipping clean up');
      return;
    }
    try {
      const services = await this.storage.getAll();
      const now = Date.now();
      const serviceTtl = this.config.serviceTtl;

      const expiredIds = services
        .filter((service) => now - +service.timestamp > serviceTtl)
        .map((service) => service.id);

      if (expiredIds.length > 0) {
        this.logger.warn(`Cleaning up ${expiredIds.length} expired services`);

        // Remove in batches to avoid overwhelming storage
        const batchSize = 10;
        for (let i = 0; i < expiredIds.length; i += batchSize) {
          const batch = expiredIds.slice(i, i + batchSize);
          await Promise.allSettled(batch.map((id) => this.storage.remove(id)));
        }
      }
    } catch (error) {
      this.logger.error(`Cleanup failed: ${error.message}`);
    }
  }
  /**
   * Check if service version matches the requested version pattern
   * Supports exact matches, ranges, and semver patterns
   */
  private matchesVersion(
    serviceVersion: string,
    requestedVersion: string,
  ): boolean {
    try {
      // Exact match
      if (serviceVersion === requestedVersion) {
        return true;
      }

      // Support semver ranges like "^1.0.0", "~1.2.0", ">=1.0.0"
      if (semver.valid(serviceVersion) && semver.validRange(requestedVersion)) {
        return semver.satisfies(serviceVersion, requestedVersion);
      }

      // Support wildcards for non-semver versions
      if (requestedVersion.endsWith('*')) {
        const prefix = requestedVersion.slice(0, -1);
        return serviceVersion.startsWith(prefix);
      }

      return false;
    } catch (error) {
      this.logger.error(
        `Error matching version ${serviceVersion} against ${requestedVersion}: ${error.message}`,
      );
      // Fallback to exact string match if semver parsing fails
      return serviceVersion === requestedVersion;
    }
  }
}
