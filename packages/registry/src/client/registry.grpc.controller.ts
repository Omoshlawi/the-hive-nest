import { Observable } from 'rxjs';
import {
  Empty,
  GetServiceRequest,
  HeartbeatRequest,
  HeartbeatResponse,
  ListServicesRequest,
  ListServicesResponse,
  RegisterServiceRequest,
  RegistryController,
  ServiceHealthResponse,
  ServiceRegistration,
  UnregisterServiceRequest,
  UnregisterServiceResponse,
} from '../types';
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

@Controller()
export class RegistryGRPCController implements RegistryController {
    
  @GrpcMethod('Registry', 'RegisterService')
  registerService(
    request: RegisterServiceRequest,
  ):
    | Promise<ServiceRegistration>
    | Observable<ServiceRegistration>
    | ServiceRegistration {
    throw new Error('Method not implemented.');
  }
  @GrpcMethod('Registry', 'GetService')
  getService(
    request: GetServiceRequest,
  ):
    | Promise<ServiceRegistration>
    | Observable<ServiceRegistration>
    | ServiceRegistration {
    throw new Error('Method not implemented.');
  }
  @GrpcMethod('Registry', 'ListServices')
  listServices(
    request: ListServicesRequest,
  ):
    | Promise<ListServicesResponse>
    | Observable<ListServicesResponse>
    | ListServicesResponse {
    throw new Error('Method not implemented.');
  }
  @GrpcMethod('Registry', 'UnregisterService')
  unregisterService(
    request: UnregisterServiceRequest,
  ):
    | Promise<UnregisterServiceResponse>
    | Observable<UnregisterServiceResponse>
    | UnregisterServiceResponse {
    throw new Error('Method not implemented.');
  }
  @GrpcMethod('Registry', 'HealthCheck')
  healthCheck(
    request: Empty,
  ):
    | Promise<ServiceHealthResponse>
    | Observable<ServiceHealthResponse>
    | ServiceHealthResponse {
    throw new Error('Method not implemented.');
  }
  @GrpcMethod('Registry', 'SendHeartbeat')
  sendHeartbeat(
    request: HeartbeatRequest,
  ):
    | Promise<HeartbeatResponse>
    | Observable<HeartbeatResponse>
    | HeartbeatResponse {
    throw new Error('Method not implemented.');
  }
}
