import { ServiceInfo, ServiceRegistryEntry } from './service-info.interface';

export interface RegistryClientOptions {
  registryUrl: string;
  timeout?: number;
  retryAttempts?: number;
  heartbeatInterval?: number;
}

export interface RegistryClient {
  /**
   * Register this service instance
   */
  register(
    serviceInfo: Omit<ServiceInfo, 'timestamp'>,
  ): Promise<ServiceRegistryEntry>;

  /**
   * Deregister this service instance
   */
  deregister(): Promise<boolean>;

  /**
   * Discover services by name
   */
  discover(serviceName: string): Promise<ServiceRegistryEntry[]>;

  /**
   * Start automatic heartbeat
   */
  startHeartbeat(): void;

  /**
   * Stop automatic heartbeat
   */
  stopHeartbeat(): void;

  /**
   * Get registry health status
   */
  getHealth(): Promise<boolean>;
}
