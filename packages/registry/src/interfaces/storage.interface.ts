import { ServiceRegistration } from '../types';

/**
 * Contract for pluggable storage backends used by `registry-service`.
 *
 * Two implementations exist:
 * - `MemoryStorage` — in-process map, used for local development and tests.
 * - `RedisStorage` — Redis-backed, used in production (lives in `registry-service`).
 *
 * To swap storage backends, provide a different `StorageAdapter` implementation
 * in the registry-service module configuration.
 */
export interface StorageAdapter {
  /** Returns all currently registered services. */
  getAll(): Promise<ServiceRegistration[]>;
  /** Returns the service with the given ID, or `null` if not found. */
  get(id: string): Promise<ServiceRegistration | null>;
  /** Persists a service registration (insert or update). */
  save(service: ServiceRegistration): Promise<ServiceRegistration>;
  /** Removes the service with the given ID. Returns the removed record or `null`. */
  remove(key: string): Promise<ServiceRegistration | null>;
  /** Removes all registrations. Returns the number of records deleted. */
  clear(): Promise<number>;

  initialize(): Promise<void>;
  close(): Promise<void>;
  /** Returns true when the underlying storage is reachable and operational. */
  healthCheck(): Promise<boolean>;
}
