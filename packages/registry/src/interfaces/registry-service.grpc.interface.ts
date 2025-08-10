export interface Service {
  name: string;
  host: string;
  port: number;
  version: string;
  instanceId: string;
  timestamp: number; // int64 → number
  ttl: number;
  metadata: Record<string, string>;
}

export interface ListServicesRequest {
  name?: string;
  instanceId?: string;
}

export interface ListServicesResponse {
  services: Service[];
}

export interface GetServiceByNameAndVersionRequest {
  name: string;
  version: string;
}

export interface GetServiceByIdRequest {
  instanceId: string;
}

export interface StorageStatus {
  type: string;
  healthy: boolean;
}

export interface ServiceHealth {
  status: string;
  timestamp: number; // int64 → number
  uptime: number; // int64 → number
  storage: StorageStatus;
}

/**
 * gRPC service definition for Registry
 */
export interface RegistryService {
  ListServices(request: ListServicesRequest): Promise<ListServicesResponse>;
  ListServicesByNameAndVersion(
    request: GetServiceByNameAndVersionRequest,
  ): Promise<ListServicesResponse>;
  GetServiceByNameAndVersion(
    request: GetServiceByNameAndVersionRequest,
  ): Promise<Service>;
  RegisterService(request: Service): Promise<Service>;
  UnregisterService(request: GetServiceByIdRequest): Promise<Service>;
  SendHeartbeat(request: GetServiceByIdRequest): Promise<Service>;
  CheckHealth(request: {}): Promise<ServiceHealth>; // google.protobuf.Empty → {}
}
