import { StorageAdapter } from '../interfaces/storage.interface';
import {
  ServiceInfo,
  ServiceRegistryEntry,
} from '../interfaces/service-info.interface';
import { Logger } from '@nestjs/common';

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
}
