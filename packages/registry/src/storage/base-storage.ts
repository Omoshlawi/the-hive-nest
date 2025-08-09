import { StorageAdapter } from '../interfaces/storage.interface';
import {
  ServiceInfo,
  ServiceRegistryEntry,
} from '../interfaces/service-info.interface';
import { Logger } from '@nestjs/common';
import semver from 'semver';

export abstract class BaseStorage implements StorageAdapter {
  protected readonly logger = new Logger(this.constructor.name);
  protected initialized = false;

  abstract register(serviceInfo: ServiceInfo): Promise<ServiceRegistryEntry>;
  abstract deregister(instanceId: string): Promise<boolean>;
  abstract findByName(serviceName: string): Promise<ServiceRegistryEntry[]>;
  abstract findByInstanceId(
    instanceId: string,
  ): Promise<ServiceRegistryEntry | null>;
  abstract findAll(): Promise<ServiceRegistryEntry[]>;
  abstract heartbeat(instanceId: string): Promise<boolean>;
  abstract cleanup(): Promise<number>;
  abstract healthCheck(): Promise<boolean>;
  abstract initialize(): Promise<void>;
  abstract close(): Promise<void>;

  /**
   * Finds and load-balances a service instance by name and version.
   *
   * Supports exact version matching, semantic version ranges, and wildcard patterns.
   * Automatically selects one instance from the matching set using a load-balancing strategy.
   *
   * @param name - The name of the service (e.g., "@hive/user-service").
   * @param version - The version string or semver expression (e.g., "1.2.3", "^1.0.0", "1.2.*").
   * @returns A single service instance that matches the criteria.
   *
   * @example
   * // Exact version
   * findByNameAndVersion("user-service", "1.2.3");
   *
   * // Semver ranges
   * findByNameAndVersion("user-service", "^1.0.0");
   * findByNameAndVersion("user-service", ">=1.0.0");
   *
   * // Wildcards
   * findByNameAndVersion("user-service", "1.2.*");
   */

  async findByNameAndVersion(
    serviceName: string,
    version: string,
  ): Promise<ServiceRegistryEntry | null> {
    try {
      // Get all services matching the name
      const services = await this.findByName(serviceName);

      if (services.length === 0) {
        return null;
      }

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
        `Load balanced ${serviceName}@${version}: selected ${selectedService.instanceId} ` +
          `(${randomIndex + 1}/${matchingServices.length} instances)`,
      );

      return selectedService;
    } catch (error) {
      this.logger.error(
        `Failed to find service ${serviceName}@${version}: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Finds all registered service instances that match the given name and version.
   *
   * Supports exact version matching, semantic version ranges, and wildcard patterns.
   *
   * @param name - The name of the service (e.g., "@hive/user-service").
   * @param version - The version string or semver expression (e.g., "1.2.3", "^1.0.0", "1.2.*").
   * @returns An array of service instances matching the criteria.
   *
   * @example
   * // Exact version
   * findAllByNameAndVersion("user-service", "1.2.3");
   *
   * // Semver ranges
   * findAllByNameAndVersion("user-service", "^1.0.0");
   * findAllByNameAndVersion("user-service", "~1.2.0");
   * findAllByNameAndVersion("user-service", ">=1.0.0");
   *
   * // Wildcards
   * findAllByNameAndVersion("user-service", "1.2.*");
   */

  async findAllByNameAndVersion(
    serviceName: string,
    version: string,
  ): Promise<ServiceRegistryEntry[]> {
    try {
      // Get all services matching the name
      const services = await this.findByName(serviceName);

      if (services.length === 0) {
        return [];
      }

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
        return [];
      }

      this.logger.debug(
        `Found ${matchingServices.length} instances for ${serviceName}@${version}`,
      );

      return matchingServices;
    } catch (error) {
      this.logger.error(
        `Failed to find services ${serviceName}@${version}: ${error.message}`,
      );
      return [];
    }
  }

  protected generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  protected createRegistryEntry(
    serviceInfo: ServiceInfo,
  ): ServiceRegistryEntry {
    const now = Date.now();
    return {
      ...serviceInfo,
      id: this.generateId(),
      timestamp: now,
      expiresAt: serviceInfo.ttl ? now + serviceInfo.ttl * 1000 : undefined,
    };
  }

  protected isExpired(entry: ServiceRegistryEntry): boolean {
    return entry.expiresAt ? Date.now() > entry.expiresAt : false;
  }

  protected matchesPattern(serviceName: string, pattern: string): boolean {
    // Support wildcards like @hive/* or exact matches
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      return serviceName.startsWith(prefix);
    }
    return serviceName === pattern;
  }

  /**
   * Check if service version matches the requested version pattern
   * Supports exact matches, ranges, and semver patterns
   */
  protected matchesVersion(
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
      // Fallback to exact string match if semver parsing fails
      return serviceVersion === requestedVersion;
    }
  }
}
