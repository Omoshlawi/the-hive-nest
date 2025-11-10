import {
  CreatePropertyRequest,
  DeletePropertyRequest,
  GetPropertyResponse,
  IPropertiesController,
  PROPERTIES_SERVICE_NAME,
  QueryPropertyRequest,
  QueryPropertyResponse,
  UpdatePropertyRequest,
} from '@hive/property';
import { Controller, NotFoundException } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { PropertiesService } from './properties.service';

@Controller('properties')
export class PropertiesController implements IPropertiesController {
  constructor(private readonly propertyService: PropertiesService) {}
  @GrpcMethod(PROPERTIES_SERVICE_NAME)
  queryProperties(
    request: QueryPropertyRequest,
  ): Promise<QueryPropertyResponse> {
    return this.propertyService.getAll(
      request,
    ) as unknown as Promise<QueryPropertyResponse>;
  }

  @GrpcMethod(PROPERTIES_SERVICE_NAME)
  async getProperty(
    request: UpdatePropertyRequest,
  ): Promise<GetPropertyResponse> {
    const res = await this.propertyService.getById(request);
    if (!res.data)
      throw new RpcException(new NotFoundException('Property not found'));
    return res as unknown as GetPropertyResponse;
  }

  @GrpcMethod(PROPERTIES_SERVICE_NAME)
  createProperty(request: CreatePropertyRequest): Promise<GetPropertyResponse> {
    return this.propertyService.create(
      request,
    ) as unknown as Promise<GetPropertyResponse>;
  }

  @GrpcMethod(PROPERTIES_SERVICE_NAME)
  updateProperty(request: UpdatePropertyRequest): Promise<GetPropertyResponse> {
    return this.propertyService.update(
      request,
    ) as unknown as Promise<GetPropertyResponse>;
  }

  @GrpcMethod(PROPERTIES_SERVICE_NAME)
  deleteProperty(request: DeletePropertyRequest): Promise<GetPropertyResponse> {
    return this.propertyService.delete(
      request,
    ) as unknown as Promise<GetPropertyResponse>;
  }
}
