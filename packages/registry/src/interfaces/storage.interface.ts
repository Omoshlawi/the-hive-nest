import { ServiceRegistration } from '../types';
/**
 * Interface defining the storage operations required for the registry.
 * Implementations must provide these methods for different storage backends.
 */
export interface IStorage {
  /** Retrieves all stored services */
  getAll(): Promise<ServiceRegistration[]>;
  get(id:string): Promise<ServiceRegistration|null>;
  /** Saves or updates a service in storage */
  save(service: ServiceRegistration): Promise<ServiceRegistration>;
  /** Removes a service by its key */
  remove(key: string): Promise<ServiceRegistration | null>;
  /** Clears all services from storage */
  clear(): Promise<number>;

  initialize(): Promise<void>;
  close(): Promise<void>;
  healthCheck(): Promise<boolean> 

}
