import { ServiceInfo, ServiceRegistryEntry } from './service-info.interface';


export interface StorageAdapter {
  /**
   * Register a service instance
   */
  register(serviceInfo: ServiceInfo): Promise<ServiceRegistryEntry>;

  /**
   * Deregister a service instance
   */
  deregister(instanceId: string): Promise<boolean>;

  /**
   * Find services by name (supports patterns like @hive/*)
   */
  findByName(serviceName: string): Promise<ServiceRegistryEntry[]>;

  /**
   * Find a specific service instance
   */
  findByInstanceId(instanceId: string): Promise<ServiceRegistryEntry | null>;

  /**
   * Find and load balance a service by name and version
   * Returns a single randomly selected instance that matches the criteria
   */
  findByNameAndVersion(
    serviceName: string, 
    version: string
  ): Promise<ServiceRegistryEntry | null>;

  /**
   * Find all services by name and version
   * Returns all instances that match the name and version criteria
   */
  findAllByNameAndVersion(
    serviceName: string, 
    version: string
  ): Promise<ServiceRegistryEntry[]>;

  /**
   * Get all registered services
   */
  findAll(): Promise<ServiceRegistryEntry[]>;

  /**
   * Update service heartbeat/timestamp
   */
  heartbeat(instanceId: string): Promise<boolean>;

  /**
   * Clean up expired services
   */
  cleanup(): Promise<number>; // Returns number of cleaned up services

  /**
   * Health check for storage
   */
  healthCheck(): Promise<boolean>;

  /**
   * Initialize storage (create indexes, connections, etc.)
   */
  initialize(): Promise<void>;

  /**
   * Close storage connections
   */
  close(): Promise<void>;
}