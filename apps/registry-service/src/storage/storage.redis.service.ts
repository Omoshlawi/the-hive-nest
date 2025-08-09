import { BaseStorage, ServiceInfo, ServiceRegistryEntry } from '@hive/registry';
import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class RedisStorage extends BaseStorage {
  private readonly SERVICES_KEY = 'services';
  private readonly INSTANCE_INDEX_KEY = 'instance_index';

  constructor(private readonly redisService: RedisService) {
    super();
  }

  async initialize(): Promise<void> {
    this.logger.log('Initializing Redis storage');

    try {
      // Test Redis connection
      await this.redisService.getClient().ping();

      // Clear existing data (optional - remove if you want persistence)
      await this.redisService.getClient().del(this.SERVICES_KEY);
      await this.redisService.getClient().del(this.INSTANCE_INDEX_KEY);

      this.initialized = true;
      this.logger.log('Redis storage initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Redis storage:', error);
      throw error;
    }
  }

  async register(serviceInfo: ServiceInfo): Promise<ServiceRegistryEntry> {
    const entry = this.createRegistryEntry(serviceInfo);

    // Remove existing instance if it exists
    await this.deregister(serviceInfo.instanceId);

    const pipeline = this.redisService.getClient().pipeline();

    // Store the service entry
    pipeline.hset(this.SERVICES_KEY, entry.id, JSON.stringify(entry));

    // Store instance mapping
    pipeline.hset(this.INSTANCE_INDEX_KEY, serviceInfo.instanceId, entry.id);

    // Set TTL if specified
    if (entry.ttl) {
      pipeline.expire(`${this.SERVICES_KEY}:${entry.id}`, entry.ttl);
    }

    await pipeline.exec();

    this.logger.log(
      `Registered service: ${serviceInfo.name} (${serviceInfo.instanceId})`,
    );
    return entry;
  }

  async deregister(instanceId: string): Promise<boolean> {
    const id = await this.redisService
      .getClient()
      .hget(this.INSTANCE_INDEX_KEY, instanceId);
    if (!id) return false;

    const pipeline = this.redisService.getClient().pipeline();
    pipeline.hdel(this.SERVICES_KEY, id);
    pipeline.hdel(this.INSTANCE_INDEX_KEY, instanceId);

    const results = await pipeline.exec();
    const deleted = results?.[0]?.[1] as number;

    if (deleted > 0) {
      this.logger.log(`Deregistered service instance: ${instanceId}`);
      return true;
    }

    return false;
  }

  async findByName(serviceName: string): Promise<ServiceRegistryEntry[]> {
    const servicesData = await this.redisService
      .getClient()
      .hgetall(this.SERVICES_KEY);
    const results: ServiceRegistryEntry[] = [];

    for (const [, entryJson] of Object.entries(servicesData)) {
      try {
        const entry: ServiceRegistryEntry = JSON.parse(entryJson);

        if (
          !this.isExpired(entry) &&
          this.matchesPattern(entry.name, serviceName)
        ) {
          results.push(entry);
        }
      } catch (error) {
        this.logger.warn(`Failed to parse service entry: ${error.message}`);
      }
    }

    return results;
  }

  async findByInstanceId(
    instanceId: string,
  ): Promise<ServiceRegistryEntry | null> {
    const id = await this.redisService
      .getClient()
      .hget(this.INSTANCE_INDEX_KEY, instanceId);
    if (!id) return null;

    const entryJson = await this.redisService
      .getClient()
      .hget(this.SERVICES_KEY, id);
    if (!entryJson) return null;

    try {
      const entry: ServiceRegistryEntry = JSON.parse(entryJson);
      if (this.isExpired(entry)) {
        // Clean up expired entry
        await this.deregister(instanceId);
        return null;
      }

      return entry;
    } catch (error) {
      this.logger.warn(`Failed to parse service entry: ${error.message}`);
      return null;
    }
  }

  async findAll(): Promise<ServiceRegistryEntry[]> {
    const servicesData = await this.redisService
      .getClient()
      .hgetall(this.SERVICES_KEY);
    const results: ServiceRegistryEntry[] = [];

    for (const [, entryJson] of Object.entries(servicesData)) {
      try {
        const entry: ServiceRegistryEntry = JSON.parse(entryJson);

        if (!this.isExpired(entry)) {
          results.push(entry);
        }
      } catch (error) {
        this.logger.warn(`Failed to parse service entry: ${error.message}`);
      }
    }

    return results;
  }

  async heartbeat(instanceId: string): Promise<boolean> {
    const id = await this.redisService
      .getClient()
      .hget(this.INSTANCE_INDEX_KEY, instanceId);
    if (!id) return false;

    const entryJson = await this.redisService
      .getClient()
      .hget(this.SERVICES_KEY, id);
    if (!entryJson) return false;

    try {
      const entry: ServiceRegistryEntry = JSON.parse(entryJson);

      const now = Date.now();
      entry.timestamp = now;
      if (entry.ttl) {
        entry.expiresAt = now + entry.ttl * 1000;
      }

      await this.redisService
        .getClient()
        .hset(this.SERVICES_KEY, id, JSON.stringify(entry));
      return true;
    } catch (error) {
      this.logger.warn(
        `Failed to update heartbeat for ${instanceId}: ${error.message}`,
      );
      return false;
    }
  }

  async cleanup(): Promise<number> {
    const servicesData = await this.redisService
      .getClient()
      .hgetall(this.SERVICES_KEY);
    let cleaned = 0;
    const toRemove: string[] = [];
    const instancesToRemove: string[] = [];

    for (const [id, entryJson] of Object.entries(servicesData)) {
      try {
        const entry: ServiceRegistryEntry = JSON.parse(entryJson);

        if (this.isExpired(entry)) {
          toRemove.push(id);
          instancesToRemove.push(entry.instanceId);
          cleaned++;
        }
      } catch (error) {
        // Remove corrupted entries too
        toRemove.push(id);
        cleaned++;
      }
    }

    if (toRemove.length > 0) {
      const pipeline = this.redisService.getClient().pipeline();

      toRemove.forEach((id) => pipeline.hdel(this.SERVICES_KEY, id));
      instancesToRemove.forEach((instanceId) =>
        pipeline.hdel(this.INSTANCE_INDEX_KEY, instanceId),
      );

      await pipeline.exec();

      this.logger.log(`Cleaned up ${cleaned} expired services`);
    }

    return cleaned;
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
    // RedisService handles its own cleanup in onModuleDestroy
    this.initialized = false;
    this.logger.log('Redis storage closed');
  }
}
