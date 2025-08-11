import { Injectable } from '@nestjs/common';
import { ServiceRegistration } from 'types';
import { BaseStorage } from './base-storage';

@Injectable()
export class MemoryStorage extends BaseStorage {
  private services = new Map<string, ServiceRegistration>();

  async initialize(): Promise<void> {
    this.services.clear();
    super.initialize();
  }

  async save(service: ServiceRegistration): Promise<ServiceRegistration> {
    // Remove existing instance if it exists
    await this.remove(service.id);
    this.services.set(service.id, service);
    this.logger.log(
      `Registered service: ${service.name}@${service.version} (${service.id})`,
    );
    return service;
  }

  async remove(id: string): Promise<ServiceRegistration | null> {
    const service = this.services.get(id);
    if (!service) {
      this.logger.debug(`Service with ID ${id} not found for removal`);
      return null;
    }
    this.services.delete(id);
    this.logger.log(`Deregistered service instance: ${id}`);
    return service;
  }

  async get(id: string): Promise<ServiceRegistration | null> {
    const service = this.services.get(id);
    if (!service) {
      this.logger.debug(`Service with ID ${id} not found in memory storage`);
      return null;
    }
    return service;
  }

  async getAll(): Promise<Array<ServiceRegistration>> {
    return Array.from(this.services.values());
  }

  async clear(): Promise<number> {
    let cleaned = Array.from(this.services.keys()).length;

    if (cleaned > 0) {
      this.logger.log(`Cleared ${cleaned} records from memory storage`);
    } else {
      this.logger.debug('No services to clear from Memory storage');
    }
    return cleaned;
  }

  async healthCheck(): Promise<boolean> {
    return this.initialized;
  }
  async close(): Promise<void> {
    this.services.clear();
    super.close();
  }
}
