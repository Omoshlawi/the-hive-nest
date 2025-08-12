import {
  Empty,
  GetServiceRequest,
  HeartbeatRequest,
  HeartbeatResponse,
  ListServicesRequest,
  ListServicesResponse,
  RegisterServiceRequest,
  REGISTRY_SERVICE_NAME,
  RegistryController,
  ServiceHealthResponse,
  ServiceRegistration,
  UnregisterServiceRequest,
} from '@hive/registry';
import { Controller, NotFoundException } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { ServiceRegistryService } from './service-registry.service';
@Controller()
export class ServiceRegistryController implements RegistryController {
  constructor(private registryService: ServiceRegistryService) {}
  @GrpcMethod(REGISTRY_SERVICE_NAME)
  registerService(
    request: RegisterServiceRequest,
  ):
    | Promise<ServiceRegistration>
    | Observable<ServiceRegistration>
    | ServiceRegistration {
    return this.registryService.registerService(request);
  }
  @GrpcMethod(REGISTRY_SERVICE_NAME)
  async getService(request: GetServiceRequest): Promise<ServiceRegistration> {
    const service = await this.registryService.getService(request);
    if (!service) {
      throw new RpcException(
        new NotFoundException('No matching service found!'),
      );
    }
    return service;
  }
  @GrpcMethod(REGISTRY_SERVICE_NAME)
  async listServices(
    request: ListServicesRequest,
  ): Promise<ListServicesResponse> {
    const services = await this.registryService.listServices(request);
    return { services };
  }
  @GrpcMethod(REGISTRY_SERVICE_NAME)
  async unregisterService(
    request: UnregisterServiceRequest,
  ): Promise<ServiceRegistration> {
    const service = await this.registryService.unregisterService(request.id);
    if (!service)
      throw new RpcException(
        new NotFoundException(
          `Service with ID ${request.id} not found for unregistration`,
        ),
      );
    return service;
  }
  @GrpcMethod(REGISTRY_SERVICE_NAME)
  healthCheck(
    request: Empty,
  ):
    | Promise<ServiceHealthResponse>
    | Observable<ServiceHealthResponse>
    | ServiceHealthResponse {
    return this.registryService.healthCheck();
  }
  @GrpcMethod(REGISTRY_SERVICE_NAME)
  async sendHeartbeat(request: HeartbeatRequest): Promise<HeartbeatResponse> {
    const res = await this.registryService.sendHeartbeat(request);
    if (!res)
      throw new RpcException(
        new NotFoundException(
          `Service with ID ${request.serviceId} not found for heartbeat`,
        ),
      );
    return res;
  }
}
