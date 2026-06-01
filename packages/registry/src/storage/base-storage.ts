/* eslint-disable @typescript-eslint/require-await */
import { Logger } from '@nestjs/common';
import { ServiceRegistration } from '../types';
import { StorageAdapter } from '../interfaces';

/**
 * Abstract base for all storage backends. Provides default no-op
 * implementations of `initialize` and `close` so concrete backends only
 * need to override them when they require setup/teardown (e.g. Redis
 * connection). All data methods are left abstract.
 *
 * Concrete implementations:
 * - `MemoryStorage` — in-process map (default, used locally and in tests)
 * - `RedisStorage` — Redis-backed (used in production, lives in `registry-service`)
 */
export abstract class BaseStorage implements StorageAdapter {
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

  abstract getAll(): Promise<ServiceRegistration[]>;
  abstract get(id: string): Promise<ServiceRegistration | null>;
  abstract save(service: ServiceRegistration): Promise<ServiceRegistration>;
  abstract remove(key: string): Promise<ServiceRegistration | null>;
  abstract clear(): Promise<number>;
  abstract healthCheck(): Promise<boolean>;
}
