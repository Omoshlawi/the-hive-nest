import { BaseStorage, ServiceInfo, ServiceRegistryEntry } from '@hive/registry';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

export interface RedisStorageOptions {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
}

@Injectable()
export class RedisStorage extends BaseStorage {
  register(serviceInfo: ServiceInfo): Promise<ServiceRegistryEntry> {
    throw new Error('Method not implemented.');
  }
  deregister(instanceId: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  findByName(serviceName: string): Promise<ServiceRegistryEntry[]> {
    throw new Error('Method not implemented.');
  }
  findByInstanceId(instanceId: string): Promise<ServiceRegistryEntry | null> {
    throw new Error('Method not implemented.');
  }
  findAll(): Promise<ServiceRegistryEntry[]> {
    throw new Error('Method not implemented.');
  }
  heartbeat(instanceId: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  cleanup(): Promise<number> {
    throw new Error('Method not implemented.');
  }
  healthCheck(): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  initialize(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  close(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
