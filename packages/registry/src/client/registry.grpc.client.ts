import { Observable } from 'rxjs';
import {
  Empty,
  GetServiceRequest,
  HeartbeatRequest,
  HeartbeatResponse,
  ListServicesRequest,
  ListServicesResponse,
  RegisterServiceRequest,
  RegistryClient,
  ServiceHealthResponse,
  ServiceRegistration,
  UnregisterServiceRequest,
  UnregisterServiceResponse,
} from '../types';
import { Injectable, Logger } from '@nestjs/common';
import { IStorage } from '../interfaces';

@Injectable()
export class RegistryServiceClient implements RegistryClient {
  private logger = new Logger(RegistryServiceClient.name);
  constructor(private storage: IStorage) {}
  registerService(
    request: RegisterServiceRequest,
  ): Observable<ServiceRegistration> {
    throw new Error('Method not implemented.');
  }
  getService(request: GetServiceRequest): Observable<ServiceRegistration> {
    throw new Error('Method not implemented.');
  }
  listServices(request: ListServicesRequest): Observable<ListServicesResponse> {
    throw new Error('Method not implemented.');
  }
  unregisterService(
    request: UnregisterServiceRequest,
  ): Observable<UnregisterServiceResponse> {
    throw new Error('Method not implemented.');
  }
  healthCheck(request: Empty): Observable<ServiceHealthResponse> {
    throw new Error('Method not implemented.');
  }
  sendHeartbeat(request: HeartbeatRequest): Observable<HeartbeatResponse> {
    throw new Error('Method not implemented.');
  }
}
