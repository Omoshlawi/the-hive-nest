import { ServiceRegistration } from '../types';
export class ServiceUtils {
  /**
   * Generate a unique instance ID
   */
  static generateInstanceId(
    serviceName: string,
    host: string,
    port: number,
  ): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${serviceName}-${host}-${port}-${timestamp}-${random}`;
  }

  /**
   * Validate service name format
   */
  static isValidServiceName(name: string): boolean {
    return /^@[a-z0-9-]+\/[a-z0-9-]+$/.test(name);
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
   * Create service URL
   */
  static createServiceUrl(
    service: ServiceRegistration,
    path = '',
    protocol = 'http',
  ): string {
    return `${protocol}://${service.host}:${service.port}${path}`;
  }

  /**
   * Check if service is healthy based on timestamp and TTL
   */
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
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;

      if (v1Part > v2Part) return 1;
      if (v1Part < v2Part) return -1;
    }

    return 0;
  }
}
