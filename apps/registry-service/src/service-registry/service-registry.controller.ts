import { Metadata, ServerUnaryCall } from '@grpc/grpc-js';
import {
  HealthResponseDto,
  HeartbeatDto,
  ListServicesResponse,
  RegisterServiceDto,
  ServiceByNameandVersionDto,
  ServiceQueryDto,
  ServicesResponseDto,
} from '@hive/registry';
import {
  Controller,
  HttpException,
  HttpStatus,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { GrpcMethod, Payload } from '@nestjs/microservices';
import { ServiceRegistryService } from './service-registry.service';
@Controller()
export class ServiceRegistryController {
  constructor(private registryService: ServiceRegistryService) {}

  @GrpcMethod('Registry', 'RegisterService')
  async register(
    registerDto: RegisterServiceDto,
    metadata: Metadata,
    call: ServerUnaryCall<any, any>,
  ) {
    const data = await this.registryService.register(registerDto);
    return data;
  }

  @GrpcMethod('Registry', 'UnregisterService')
  deregister(@Payload() instanceId: string) {
    return this.registryService.deregister(instanceId);
  }

  @GrpcMethod('Registry', 'ListServices')
  async findServices(
    payload: ServiceQueryDto,
    metadata: Metadata,
    call: ServerUnaryCall<any, any>,
  ): Promise<ListServicesResponse> {
    const services = await this.registryService.findServices(payload);
    return {
      services: services.map((service) => ({
        host: service.host,
        instanceId: service.instanceId,
        metadata: service.metadata ?? {},
        name: service.name,
        port: service.port,
        timestamp: service.timestamp,
        ttl: service.ttl ?? 1234,
        version: service.version,
      })),
    };
  }

  @GrpcMethod('Registry', 'GetServiceByNameAndVersion')
  async findByNameAndVersion(@Query() query: ServiceByNameandVersionDto) {
    const service = await this.registryService.findByNameAndVersion(query);
    if (!service)
      throw new NotFoundException({ detail: 'No matching service found' });
    return service;
  }

  @GrpcMethod('Registry', 'ListServicesByNameAndVersion')
  findAllByNameAndVersion(
    @Query() query: ServiceByNameandVersionDto,
  ): Promise<ServicesResponseDto['results']> {
    return this.registryService.findAllByNameAndVersion(query);
  }

  @GrpcMethod('Registry', 'SendHeartbeat')
  async heartbeat(@Payload() heartbeatDto: HeartbeatDto) {
    const success = await this.registryService.heartbeat(
      heartbeatDto.instanceId!,
    );
    if (!success) {
      throw new HttpException(
        'Service instance not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      message: 'Heartbeat received successfully',
    };
  }

  @GrpcMethod('Registry', 'CheckHealth')
  async getHealth(): Promise<HealthResponseDto> {
    return this.registryService.getHealth();
  }
}
