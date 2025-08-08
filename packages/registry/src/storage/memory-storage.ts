import { Injectable } from '@nestjs/common';
import { BaseStorage } from './base-storage';
import {
  ServiceInfo,
  ServiceRegistryEntry,
} from '../interfaces/service-info.interface';

@Injectable()
export class MemoryStorage extends BaseStorage {
  private services = new Map<string, ServiceRegistryEntry>();
  private instanceIndex = new Map<string, string>(); // instanceId -> id mapping

  async initialize(): Promise<void> {
    this.logger.log('Initializing memory storage');
    this.services.clear();
    this.instanceIndex.clear();
    this.initialized = true;
  }

  async register(serviceInfo: ServiceInfo): Promise<ServiceRegistryEntry> {
    const entry = this.createRegistryEntry(serviceInfo);

    // Remove existing instance if it exists
    await this.deregister(serviceInfo.instanceId);

    this.services.set(entry.id, entry);
    this.instanceIndex.set(serviceInfo.instanceId, entry.id);

    this.logger.log(
      `Registered service: ${serviceInfo.name} (${serviceInfo.instanceId})`,
    );
    return entry;
  }

  async deregister(instanceId: string): Promise<boolean> {
    const id = this.instanceIndex.get(instanceId);
    if (!id) return false;

    this.services.delete(id);
    this.instanceIndex.delete(instanceId);

    this.logger.log(`Deregistered service instance: ${instanceId}`);
    return true;
  }

  async findByName(serviceName: string): Promise<ServiceRegistryEntry[]> {
    const results: ServiceRegistryEntry[] = [];

    for (const entry of this.services.values()) {
      if (
        !this.isExpired(entry) &&
        this.matchesPattern(entry.name, serviceName)
      ) {
        results.push(entry);
      }
    }

    return results;
  }

  async findByInstanceId(
    instanceId: string,
  ): Promise<ServiceRegistryEntry | null> {
    const id = this.instanceIndex.get(instanceId);
    if (!id) return null;

    const entry = this.services.get(id);
    if (!entry || this.isExpired(entry)) return null;

    return entry;
  }

  async findAll(): Promise<ServiceRegistryEntry[]> {
    const results: ServiceRegistryEntry[] = [];

    for (const entry of this.services.values()) {
      if (!this.isExpired(entry)) {
        results.push(entry);
      }
    }

    return results;
  }

  async heartbeat(instanceId: string): Promise<boolean> {
    const id = this.instanceIndex.get(instanceId);
    if (!id) return false;

    const entry = this.services.get(id);
    if (!entry) return false;

    const now = Date.now();
    entry.timestamp = now;
    if (entry.ttl) {
      entry.expiresAt = now + entry.ttl * 1000;
    }

    this.services.set(id, entry);
    return true;
  }

  async cleanup(): Promise<number> {
    let cleaned = 0;
    const toRemove: string[] = [];

    for (const [id, entry] of this.services.entries()) {
      if (this.isExpired(entry)) {
        toRemove.push(id);
        this.instanceIndex.delete(entry.instanceId);
        cleaned++;
      }
    }

    toRemove.forEach((id) => this.services.delete(id));

    if (cleaned > 0) {
      this.logger.log(`Cleaned up ${cleaned} expired services`);
    }

    return cleaned;
  }

  async healthCheck(): Promise<boolean> {
    return this.initialized;
  }

  async close(): Promise<void> {
    this.services.clear();
    this.instanceIndex.clear();
    this.initialized = false;
    this.logger.log('Memory storage closed');
  }
}
