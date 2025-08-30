import { Logger } from '@nestjs/common';
import semver from 'semver';
import { v4 as uuidv4 } from 'uuid';
import { SERVICE_NAME_REGEX } from '../constants';
import { RegisterServiceDto } from '../dto';
import { QueryServicesRequest, ServiceRegistration } from '../types';

export class ServiceUtils {
  private static readonly logger = new Logger(ServiceUtils.name);

  /**
   * Generate a unique instance ID
   */
  static generateInstanceId(
    registerServiceDto: RegisterServiceDto,
    maxRetries = 5,
  ): string {
    const servicePart =
      registerServiceDto.name?.replace(/[/]/g, '-')?.replace(/[@]/g, '') ||
      'unknown';
    const uuid = uuidv4();
    const instanceId = `${servicePart}-${uuid}`;
    return instanceId;
  }

  /**
   * Validate service name format
   */
  static isValidServiceName(name: string): boolean {
    return SERVICE_NAME_REGEX.test(name);
  }

  /**
   * Extract namespace from service name
   */
  static getNamespace(serviceName: string): string {
    const match = serviceName.match(/^@([^/]+)\//);
    return match ? match[1] : '';
  }

  /**
   * Extract service name without namespace
   */
  static getServiceName(fullName: string): string {
    const match = fullName.match(/^@[^/]+\/(.+)$/);
    return match ? match[1] : fullName;
  }

  /**
   * Check if service is healthy based on timestamp and TTL
   */
  // TODO: Clearly define health specification
  static isServiceHealthy(
    service: ServiceRegistration,
    maxAge = 300000,
  ): boolean {
    const now = Date.now();
    const age = now - +service.timestamp;

    // if (service.ttl) {
    //   return age < service.ttl * 1000;
    // }

    return age < maxAge;
  }

  /**
   * Sort services by priority (health, version, timestamp)
   */
  static sortServices(services: ServiceRegistration[]): ServiceRegistration[] {
    return [...services].sort((a, b) => {
      // First by health
      const aHealthy = ServiceUtils.isServiceHealthy(a);
      const bHealthy = ServiceUtils.isServiceHealthy(b);

      if (aHealthy !== bHealthy) {
        return bHealthy ? 1 : -1;
      }

      // Then by version (semantic versioning)
      const versionCompare = ServiceUtils.compareVersions(a.version, b.version);
      if (versionCompare !== 0) {
        return -versionCompare; // Newer versions first
      }

      // Finally by timestamp (newer first)
      return +b.timestamp - +a.timestamp;
    });
  }

  /**
   * Compare semantic versions
   */
  static compareVersions(version1: string, version2: string): number {
    return semver.compare(version1, version2);
  }

  static createRegistryServiceEntry(
    instanceId: string,
    registerDto: RegisterServiceDto,
  ): ServiceRegistration {
    return {
      ...registerDto,
      id: instanceId,
      timestamp: Date.now().toString(),
      metadata: registerDto.metadata ?? {},
      endpoints:
        registerDto.endpoints?.map((endpoint) => ({
          ...endpoint,
          metadata: endpoint.metadata ?? {},
          protocol: endpoint.protocol as any,
        })) ?? [],
    };
  }

  // TODO: Implement various load balancing strategy asides randomizing
  static loadBalanceAndFindOneService(
    allServices: Array<ServiceRegistration> = [],
  ) {
    const randomIndex = Math.floor(Math.random() * allServices.length);
    const selectedService = allServices[randomIndex];
    return { index: randomIndex, service: selectedService };
  }

  static matchServiceNamePattern(
    serviceName: string,
    pattern: string,
  ): boolean {
    // Support wildcards like @hive/* or exact matches
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      return serviceName.startsWith(prefix);
    }
    return serviceName === pattern;
  }

  static filterServices(
    services: Array<ServiceRegistration>,
    criteria: QueryServicesRequest,
  ): Array<ServiceRegistration> {
    let filteredServices = services;
    const { tags, name, version, metadata } = criteria ?? {};

    // Filter by name pattern if provided
    if (name) {
      const beforeCount = filteredServices.length;
      filteredServices = filteredServices.filter((service) =>
        ServiceUtils.matchServiceNamePattern(service.name, name),
      );
      this.logger.debug(
        `Name filter '${name}': ${beforeCount} → ${filteredServices.length} services`,
      );
    }

    // Filter by version if provided
    if (version) {
      const beforeCount = filteredServices.length;
      filteredServices = filteredServices.filter((service) =>
        this.matchServiceNamePattern(service.version, version),
      );
      this.logger.debug(
        `Version filter '${version}': ${beforeCount} → ${filteredServices.length} services`,
      );
    }

    // Filter by tags if provided
    if (tags && tags.length > 0) {
      const beforeCount = filteredServices.length;
      filteredServices = filteredServices.filter((service) => {
        const serviceTags = service.tags || [];
        return tags.every((tag) => serviceTags.includes(tag));
      });
      this.logger.debug(
        `Tags filter [${tags.join(', ')}]: ${beforeCount} → ${filteredServices.length} services`,
      );
    }

    // Filter by metadata if provided
    if (metadata && Object.keys(metadata).length > 0) {
      const beforeCount = filteredServices.length;
      filteredServices = filteredServices.filter((service) => {
        const serviceMetadata = service.metadata || {};
        return Object.entries(metadata).every(
          ([key, value]) => serviceMetadata[key] === value,
        );
      });
      this.logger.debug(
        `Metadata filter {${Object.entries(metadata)
          .map(([k, v]) => `${k}=${v}`)
          .join(', ')}}: ` +
          `${beforeCount} → ${filteredServices.length} services`,
      );
    }
    return filteredServices;
  }

  static expiredServiceIds(
    services: Array<ServiceRegistration>,
    ttl: number,
  ): Array<string> {
    const now = Date.now();

    return services
      .filter((service) => now - +service.timestamp > ttl)
      .map((service) => service.id);
  }

  /**
   * Check if service version matches the requested version pattern
   * Supports exact matches, ranges, and semver patterns
   */
  static serviceMatchesVersion(
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
