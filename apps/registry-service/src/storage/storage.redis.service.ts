import { Injectable } from '@nestjs/common';
import { ServiceRegistration, BaseStorage } from '@hive/registry';
import { RedisService } from './redis.service';
import { AppConfig } from 'src/config/app.config';

@Injectable()
export class RedisStorage extends BaseStorage {
  private readonly keyPrefix: string;
  private readonly ttl: number;

  constructor(
    private readonly redisService: RedisService,
    private readonly config: AppConfig,
  ) {
    super();
    this.keyPrefix = `${this.config.serviceName}:${this.config.serviceVersion}:services:`;
    this.ttl = this.config.serviceTtl || 0; // 0 means no TTL
  }

  async initialize(): Promise<void> {
    try {
      // Test Redis connection
      await this.redisService.getClient().ping();
      super.initialize();
    } catch (error) {
      this.logger.error('Failed to initialize Redis storage:', error);
      throw error;
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

  async get(id: string): Promise<ServiceRegistration | null> {
    try {
      const serviceKey = this.keyPrefix + id;
      const entryJson = await this.redisService.getClient().get(serviceKey);

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

  async save(service: ServiceRegistration): Promise<ServiceRegistration> {
    try {
      const serviceKey = this.keyPrefix + service.id;
      const serviceData = JSON.stringify(service);

      // Save with TTL if configured, otherwise save without expiration
      if (this.ttl > 0) {
        await this.redisService
          .getClient()
          .set(serviceKey, serviceData, 'EX', this.ttl);

        this.logger.debug(
          `Saved service ${service.name}@${service.version} (${service.id}) ` +
            `to Redis storage with TTL: ${this.ttl}s`,
        );
      } else {
        await this.redisService.getClient().set(serviceKey, serviceData);

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
      // First, get the service to return it if it exists
      const existingService = await this.get(id);

      if (!existingService) {
        this.logger.debug(`Service with ID ${id} not found for removal`);
        return null;
      }

      const serviceKey = this.keyPrefix + id;
      const deletedCount = await this.redisService.getClient().del(serviceKey);

      if (deletedCount > 0) {
        this.logger.log(
          `Removed service ${existingService.name}@${existingService.version} ` +
            `(${id}) from Redis storage`,
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
      const pattern = this.keyPrefix + '*';
      const keys = await this.redisService.getClient().keys(pattern);

      if (keys.length === 0) {
        this.logger.debug('No services to clear from Redis storage');
        return 0;
      }

      const deletedCount = await this.redisService.getClient().del(...keys);

      this.logger.log(`Cleared ${deletedCount} services from Redis storage`);
      return deletedCount;
    } catch (error) {
      this.logger.error(
        `Failed to clear services from Redis storage: ${error.message}`,
      );
      return 0;
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
  /**
   * Get Redis client statistics (useful for monitoring)
   */
  async getStats(): Promise<{
    totalServices: number;
    keyPrefix: string;
    ttl: number;
  }> {
    const totalServices = (await this.getAll()).length;
    return {
      totalServices,
      keyPrefix: this.keyPrefix,
      ttl: this.ttl,
    };
  }
}
