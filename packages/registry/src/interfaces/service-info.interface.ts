export interface ServiceInfo {
  name: string; // @hive/sample-service
  host: string; // localhost, 192.168.1.100
  port: number; // 3001
  version: string; // 1.0.0, 1.2.3-beta
  instanceId: string; // unique instance identifier
  timestamp: number; // Unix timestamp
  ttl?: number; // Time to live in seconds (optional)
  metadata?: Record<string, any>; // Additional service metadata
}

export interface ServiceRegistryEntry extends ServiceInfo {
  id: string; // Unique registry entry ID
  expiresAt?: number; // Calculated expiration timestamp
}

export enum ServiceStatus {
  HEALTHY = 'healthy',
  UNHEALTHY = 'unhealthy',
  UNKNOWN = 'unknown',
}
