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

export interface StorageConfig {
  type: 'memory' | 'redis';
  options?: Record<string, any>;
}
