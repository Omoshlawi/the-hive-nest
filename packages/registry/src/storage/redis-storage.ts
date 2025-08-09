// import { Injectable } from '@nestjs/common';
// // import { Redis } from 'ioredis';
// import { BaseStorage } from './base-storage';
// import { ServiceInfo, ServiceRegistryEntry } from '../interfaces/service-info.interface';

// export interface RedisStorageOptions {
//   host?: string;
//   port?: number;
//   password?: string;
//   db?: number;
//   keyPrefix?: string;
//   retryDelayOnFailover?: number;
//   enableReadyCheck?: boolean;
//   maxRetriesPerRequest?: number;
// }

// @Injectable()
// export class RedisStorage extends BaseStorage {
//   private redis: Redis;
//   private readonly keyPrefix: string;
//   private readonly SERVICES_KEY = 'services';
//   private readonly INSTANCES_KEY = 'instances';

//   constructor(private readonly options: RedisStorageOptions = {}) {
//     super();
//     this.keyPrefix = options.keyPrefix || 'hive:registry:';
//   }

//   async initialize(): Promise<void> {
//     this.logger.log('Initializing Redis storage');
    
//     this.redis = new Redis({
//       host: this.options.host || 'localhost',
//       port: this.options.port || 6379,
//       password: this.options.password,
//       db: this.options.db || 0,
//       retryDelayOnFailover: this.options.retryDelayOnFailover || 100,
//       enableReadyCheck: this.options.enableReadyCheck ?? true,
//       maxRetriesPerRequest: this.options.maxRetriesPerRequest || 3,
//     });

//     // Test connection
//     await this.redis.ping();
//     this.initialized = true;
//     this.logger.log('Redis storage initialized successfully');
//   }

//   async register(serviceInfo: ServiceInfo): Promise<ServiceRegistryEntry> {
//     const entry = this.createRegistryEntry(serviceInfo);
    
//     // Use pipeline for atomic operations
//     const pipeline = this.redis.pipeline();
    
//     // Remove existing instance if it exists
//     const existingId = await this.redis.hget(
//       this.getKey(this.INSTANCES_KEY), 
//       serviceInfo.instanceId
//     );
    
//     if (existingId) {
//       pipeline.hdel(this.getKey(this.SERVICES_KEY), existingId);
//     }
    
//     // Store service entry
//     pipeline.hset(
//       this.getKey(this.SERVICES_KEY),
//       entry.id,
//       JSON.stringify(entry)
//     );
    
//     // Index by instance ID
//     pipeline.hset(
//       this.getKey(this.INSTANCES_KEY),
//       serviceInfo.instanceId,
//       entry.id
//     );
    
//     // Set TTL if specified
//     if (entry.expiresAt) {
//       const ttlSeconds = Math.ceil((entry.expiresAt - Date.now()) / 1000);
//       pipeline.expire(this.getKey(this.SERVICES_KEY, entry.id), ttlSeconds);
//     }
    
//     await pipeline.exec();
    
//     this.logger.log(`Registered service: ${serviceInfo.name} (${serviceInfo.instanceId})`);
//     return entry;
//   }

//   async deregister(instanceId: string): Promise<boolean> {
//     const id = await this.redis.hget(this.getKey(this.INSTANCES_KEY), instanceId);
//     if (!id) return false;

//     const pipeline = this.redis.pipeline();
//     pipeline.hdel(this.getKey(this.SERVICES_KEY), id);
//     pipeline.hdel(this.getKey(this.INSTANCES_KEY), instanceId);
    
//     await pipeline.exec();
    
//     this.logger.log(`Deregistered service instance: ${instanceId}`);
//     return true;
//   }

//   async findByName(serviceName: string): Promise<ServiceRegistryEntry[]> {
//     const servicesData = await this.redis.hgetall(this.getKey(this.SERVICES_KEY));
//     const results: ServiceRegistryEntry[] = [];

//     for (const data of Object.values(servicesData)) {
//       try {
//         const entry: ServiceRegistryEntry = JSON.parse(data);
//         if (!this.isExpired(entry) && this.matchesPattern(entry.name, serviceName)) {
//           results.push(entry);
//         }
//       } catch (error) {
//       throw new HttpException(
//         `Failed to register service: ${error.message}`,
//         HttpStatus.INTERNAL_SERVER_ERROR
//       );
//     }
//   }

// }