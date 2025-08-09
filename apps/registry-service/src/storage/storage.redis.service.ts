import { BaseStorage, ServiceInfo, ServiceRegistryEntry } from '@hive/registry';
import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';
import { AppConfig } from 'src/config/app.config';

@Injectable()
export class RedisStorage extends BaseStorage {
  private readonly keyPrefix: string;
  private readonly instanceIndexPrefix: string;

  constructor(
    private readonly redisService: RedisService,
    private readonly config: AppConfig,
  ) {
    super();
    this.keyPrefix = `${this.config.serviceName}:${this.config.serviceVersion}:services:`;
    this.instanceIndexPrefix = `${this.config.serviceName}:${this.config.serviceVersion}:instances:`;
  }

  async initialize(): Promise<void> {
    this.logger.log('Initializing Redis storage');

    try {
      // Test Redis connection
      await this.redisService.getClient().ping();
      this.initialized = true;
      this.logger.log('Redis storage initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Redis storage:', error);
      throw error;
    }
  }

  async register(
    serviceInfo: Omit<ServiceInfo, 'ttl'>,
  ): Promise<ServiceRegistryEntry> {
    const entry = this.createRegistryEntry(serviceInfo);

    try {
      // Remove existing instance if it exists
      await this.deregister(serviceInfo.instanceId);

      const serviceKey = this.keyPrefix + entry.id;
      const instanceKey = this.instanceIndexPrefix + serviceInfo.instanceId;

      const pipeline = this.redisService.getClient().pipeline();

      // Store service entry with TTL if specified
      if (this.config.serviceTtl) {
        pipeline.set(
          serviceKey,
          JSON.stringify({ ...entry, ttl: this.config.serviceTtl }),
          'EX',
          this.config.serviceTtl,
        );
        pipeline.set(instanceKey, entry.id, 'EX', this.config.serviceTtl);
      } else {
        pipeline.set(serviceKey, JSON.stringify(entry));
        pipeline.set(instanceKey, entry.id);
      }

      await pipeline.exec();

      this.logger.log(
        `Registered service: ${serviceInfo.name}:${serviceInfo.version} (${serviceInfo.instanceId})`,
      );
      return entry;
    } catch (error) {
      this.logger.error(`Failed to register service: ${error.message}`);
      throw error;
    }
  }

  async deregister(instanceId: string): Promise<boolean> {
    try {
      const instanceKey = this.instanceIndexPrefix + instanceId;
      const id = await this.redisService.getClient().get(instanceKey);

      if (!id) return false;

      const serviceKey = this.keyPrefix + id;
      const pipeline = this.redisService.getClient().pipeline();

      pipeline.del(serviceKey);
      pipeline.del(instanceKey);

      const results = await pipeline.exec();
      const deleted =
        (results?.[0]?.[1] as number) + (results?.[1]?.[1] as number);

      if (deleted > 0) {
        this.logger.log(`Deregistered service instance: ${instanceId}`);
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(`Failed to deregister service: ${error.message}`);
      return false;
    }
  }

  async findByName(serviceName: string): Promise<ServiceRegistryEntry[]> {
    try {
      const pattern = this.keyPrefix + '*';
      const keys = await this.redisService.getClient().keys(pattern);

      if (keys.length === 0) return [];

      const servicesData = await this.redisService.getClient().mget(keys);
      const results: ServiceRegistryEntry[] = [];

      for (const entryJson of servicesData) {
        if (!entryJson) continue;

        try {
          const entry: ServiceRegistryEntry = JSON.parse(entryJson);

          // No need to check expiration - Redis handles it automatically
          if (this.matchesPattern(entry.name, serviceName)) {
            results.push(entry);
          }
        } catch (error) {
          this.logger.warn(`Failed to parse service entry: ${error.message}`);
        }
      }

      return results;
    } catch (error) {
      this.logger.error(`Failed to find services by name: ${error.message}`);
      return [];
    }
  }

  async findByInstanceId(
    instanceId: string,
  ): Promise<ServiceRegistryEntry | null> {
    try {
      const instanceKey = this.instanceIndexPrefix + instanceId;
      const id = await this.redisService.getClient().get(instanceKey);

      if (!id) return null;

      const serviceKey = this.keyPrefix + id;
      const entryJson = await this.redisService.getClient().get(serviceKey);

      if (!entryJson) return null;

      return JSON.parse(entryJson);
    } catch (error) {
      this.logger.error(
        `Failed to find service by instance ID: ${error.message}`,
      );
      return null;
    }
  }

  async findAll(): Promise<ServiceRegistryEntry[]> {
    try {
      const pattern = this.keyPrefix + '*';
      const keys = await this.redisService.getClient().keys(pattern);

      if (keys.length === 0) return [];

      const servicesData = await this.redisService.getClient().mget(keys);
      const results: ServiceRegistryEntry[] = [];

      for (const entryJson of servicesData) {
        if (!entryJson) continue;

        try {
          const entry: ServiceRegistryEntry = JSON.parse(entryJson);
          results.push(entry);
        } catch (error) {
          this.logger.warn(`Failed to parse service entry: ${error.message}`);
        }
      }

      return results;
    } catch (error) {
      this.logger.error(`Failed to get all services: ${error.message}`);
      return [];
    }
  }

  async heartbeat(instanceId: string): Promise<boolean> {
    try {
      const instanceKey = this.instanceIndexPrefix + instanceId;
      const id = await this.redisService.getClient().get(instanceKey);

      if (!id) return false;

      const serviceKey = this.keyPrefix + id;
      const entryJson = await this.redisService.getClient().get(serviceKey);

      if (!entryJson) return false;

      const entry: ServiceRegistryEntry = JSON.parse(entryJson);
      const now = Date.now();
      entry.timestamp = now;

      // Update entry and refresh TTL
      if (entry.ttl) {
        await this.redisService
          .getClient()
          .set(serviceKey, JSON.stringify(entry), 'EX', entry.ttl);
        await this.redisService
          .getClient()
          .set(instanceKey, id, 'EX', entry.ttl);
      } else {
        await this.redisService
          .getClient()
          .set(serviceKey, JSON.stringify(entry));
      }

      return true;
    } catch (error) {
      this.logger.error(`Failed to update heartbeat: ${error.message}`);
      return false;
    }
  }

  async cleanup(): Promise<number> {
    // With Redis TTL, cleanup is automatic!
    // This method can be a no-op or just return 0
    this.logger.log('Redis TTL handles cleanup automatically');
    return 0;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.redisService.getClient().ping();
      return this.initialized;
    } catch (error) {
      this.logger.error('Redis health check failed:', error);
      return false;
    }
  }

  async close(): Promise<void> {
    this.initialized = false;
    this.logger.log('Redis storage closed');
  }
}
