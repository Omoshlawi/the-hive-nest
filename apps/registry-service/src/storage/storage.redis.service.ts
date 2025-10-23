/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-floating-promises */
// Updated RedisStorage to provide complete service data on expiration

import { Injectable } from '@nestjs/common';
import { ServiceRegistration, BaseStorage } from '@hive/registry';
import { RedisService } from './redis.service';
import { AppConfig } from '../config/app.config';

@Injectable()
export class RedisStorage extends BaseStorage {
  private readonly keyPrefix: string;
  private readonly backupKeyPrefix: string;
  private readonly ttl: number;
  private serviceExpiredCallbacks: Array<
    (service: ServiceRegistration) => void
  > = [];

  constructor(
    private readonly redisService: RedisService,
    private readonly config: AppConfig,
  ) {
    super();
    this.keyPrefix = `${this.config.serviceName}:${this.config.serviceVersion}:services:`;
    this.backupKeyPrefix = `${this.config.serviceName}:${this.config.serviceVersion}:backup:`;
    this.ttl = this.config.serviceTtl || 0;
  }

  async initialize(): Promise<void> {
    try {
      await this.redisService.getClient().ping();
      this.setupServiceExpirationListener();
      super.initialize();
    } catch (error) {
      this.logger.error('Failed to initialize Redis storage:', error);
      throw error;
    }
  }

  private setupServiceExpirationListener(): void {
    this.redisService.addExpirationListener(
      async (expiredKey: string, _channel: string, _db: number) => {
        // Only handle main service keys (not backup keys)
        if (
          expiredKey.startsWith(this.keyPrefix) &&
          !expiredKey.includes(':backup:')
        ) {
          this.logger.debug(`Service key expired: ${expiredKey}`);

          const serviceId = expiredKey.slice(this.keyPrefix.length);
          const backupKey = this.backupKeyPrefix + serviceId;

          try {
            // Retrieve service data from backup key
            const serviceData = await this.redisService.get(backupKey);

            if (serviceData) {
              const service: ServiceRegistration = JSON.parse(
                serviceData,
              ) as ServiceRegistration;

              // Clean up backup key
              await this.redisService.del(backupKey);

              this.logger.log(
                `Service expired via TTL: ${service.name}@${service.version} (${serviceId})`,
              );

              // Call all registered callbacks with complete service data
              this.serviceExpiredCallbacks.forEach((callback) => {
                try {
                  callback(service);
                } catch (error) {
                  this.logger.error(
                    `Error in service expired callback for service ${serviceId}:`,
                    error,
                  );
                }
              });
            } else {
              this.logger.warn(
                `No backup data found for expired service: ${serviceId}`,
              );
            }
          } catch (error) {
            this.logger.error(
              `Error handling expired service ${serviceId}:`,
              error,
            );
          }
        }
      },
    );
  }

  onServiceExpired(callBackFn: (service: ServiceRegistration) => void): void {
    this.logger.debug('Registering service expired callback');
    this.serviceExpiredCallbacks.push(callBackFn);
  }

  async save(service: ServiceRegistration): Promise<ServiceRegistration> {
    try {
      const serviceKey = this.keyPrefix + service.id;
      const backupKey = this.backupKeyPrefix + service.id;
      const serviceData = JSON.stringify(service);

      if (this.ttl > 0) {
        // Save main service with TTL
        await this.redisService.set(serviceKey, serviceData, this.ttl);

        // Save backup without TTL (for expiration callback)
        // The backup will be cleaned up when the main key expires
        await this.redisService.set(backupKey, serviceData);

        this.logger.debug(
          `Saved service ${service.name}@${service.version} (${service.id}) ` +
            `to Redis storage with TTL: ${this.ttl}s (with backup)`,
        );
      } else {
        // No TTL - just save main service
        await this.redisService.set(serviceKey, serviceData);

        this.logger.debug(
          `Saved service ${service.name}@${service.version} (${service.id}) ` +
            `to Redis storage without TTL`,
        );
      }

      return service;
    } catch (error) {
      this.logger.error(
        `Failed to save service ${service.name}@${service.version} (${service.id}): ${error.message}`,
      );
      throw error;
    }
  }

  async remove(id: string): Promise<ServiceRegistration | null> {
    try {
      const existingService = await this.get(id);

      if (!existingService) {
        this.logger.debug(`Service with ID ${id} not found for removal`);
        return null;
      }

      const serviceKey = this.keyPrefix + id;
      const backupKey = this.backupKeyPrefix + id;

      // Remove both main and backup keys
      const deletedCount = await this.redisService
        .getClient()
        .del(serviceKey, backupKey);

      if (deletedCount > 0) {
        this.logger.log(
          `Removed service ${existingService.name}@${existingService.version} ` +
            `(${id}) from Redis storage (including backup)`,
        );
        return existingService;
      } else {
        this.logger.warn(
          `Failed to remove service with ID ${id} from Redis storage`,
        );
        return null;
      }
    } catch (error) {
      this.logger.error(
        `Failed to remove service with ID ${id}: ${error.message}`,
      );
      return null;
    }
  }

  async clear(): Promise<number> {
    try {
      const mainPattern = this.keyPrefix + '*';
      const backupPattern = this.backupKeyPrefix + '*';

      const [mainKeys, backupKeys] = await Promise.all([
        this.redisService.getClient().keys(mainPattern),
        this.redisService.getClient().keys(backupPattern),
      ]);

      const allKeys = [...mainKeys, ...backupKeys];

      if (allKeys.length === 0) {
        this.logger.debug('No services to clear from Redis storage');
        return 0;
      }

      const deletedCount = await this.redisService.getClient().del(...allKeys);

      this.logger.log(
        `Cleared ${deletedCount} keys (services + backups) from Redis storage`,
      );
      return Math.floor(deletedCount / 2); // Return service count, not key count
    } catch (error) {
      this.logger.error(
        `Failed to clear services from Redis storage: ${error.message}`,
      );
      return 0;
    }
  }

  // ... rest of the methods remain the same (get, getAll, healthCheck, getStats)

  async get(id: string): Promise<ServiceRegistration | null> {
    try {
      const serviceKey = this.keyPrefix + id;
      const entryJson = await this.redisService.get(serviceKey);

      if (!entryJson) {
        this.logger.debug(`Service with ID ${id} not found in Redis storage`);
        return null;
      }

      const service: ServiceRegistration = JSON.parse(entryJson);
      this.logger.debug(
        `Retrieved service ${service.name}@${service.version} (${id}) from Redis storage`,
      );
      return service;
    } catch (error) {
      this.logger.error(`Failed to get service by ID ${id}: ${error.message}`);
      return null;
    }
  }

  async getAll(): Promise<ServiceRegistration[]> {
    try {
      const pattern = this.keyPrefix + '*';
      const keys = await this.redisService.getClient().keys(pattern);

      if (keys.length === 0) {
        this.logger.debug('No services found in Redis storage');
        return [];
      }

      const servicesData = await this.redisService.getClient().mget(keys);
      const results: ServiceRegistration[] = [];

      for (const entryJson of servicesData) {
        if (!entryJson) continue;

        try {
          const service: ServiceRegistration = JSON.parse(entryJson);
          results.push(service);
        } catch (error) {
          this.logger.warn(`Failed to parse service entry: ${error.message}`);
        }
      }

      this.logger.debug(
        `Retrieved ${results.length} services from Redis storage`,
      );
      return results;
    } catch (error) {
      this.logger.error(`Failed to get all services: ${error.message}`);
      return [];
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.redisService.getClient().ping();
      const isHealthy = this.initialized;
      this.logger.debug(
        `Redis storage health check: ${isHealthy ? 'healthy' : 'unhealthy'}`,
      );
      return isHealthy;
    } catch (error) {
      this.logger.error('Redis storage health check failed:', error);
      return false;
    }
  }

  async getStats(): Promise<{
    totalServices: number;
    keyPrefix: string;
    ttl: number;
    registeredCallbacks: number;
  }> {
    const totalServices = (await this.getAll()).length;
    return {
      totalServices,
      keyPrefix: this.keyPrefix,
      ttl: this.ttl,
      registeredCallbacks: this.serviceExpiredCallbacks.length,
    };
  }
}
