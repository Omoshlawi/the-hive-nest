import { Logger } from '@nestjs/common';
import { ServiceRegistration } from '../types';
import { IStorage } from '../interfaces'; // Assuming IStorage is in this file path

export abstract class BaseStorage implements IStorage {
  protected readonly logger = new Logger(this.constructor.name);
  protected initialized = false;

  async initialize(): Promise<void> {
    this.initialized = true;
    this.logger.log('Initialized storage');
  }
  async close(): Promise<void> {
    this.initialized = false;
    this.logger.log('Storage closed');
  }

  // Implement the methods from the IStorage interface
  abstract getAll(): Promise<ServiceRegistration[]>;
  abstract get(id: string): Promise<ServiceRegistration | null>;
  abstract save(service: ServiceRegistration): Promise<ServiceRegistration>;
  abstract remove(key: string): Promise<ServiceRegistration | null>;
  abstract clear(): Promise<number>;
  abstract healthCheck(): Promise<boolean>;
}
