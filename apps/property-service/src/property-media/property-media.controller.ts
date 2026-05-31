import {
  CreatePropertyMediaRequest,
  DeletePropertyMediaRequest,
  GetPropertyMediaRequest,
  GetPropertyMediaResponse,
  IPropertyMediaController,
  PROPERTIES_SERVICE_NAME,
  QueryPropertyMediaRequest,
  QueryPropertyMediaResponse,
  UpdatePropertyMediaRequest,
} from '@hive/property';
import { Controller, NotFoundException } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { PropertyMediaService } from './property-media.service';

@Controller('property-media')
export class PropertyMediaController implements IPropertyMediaController {
  constructor(private readonly propertyMediaService: PropertyMediaService) {}

  @GrpcMethod(PROPERTIES_SERVICE_NAME, 'queryPropertyMedia')
  queryPropertyMedia(
    request: QueryPropertyMediaRequest,
  ): Promise<QueryPropertyMediaResponse> {
    return this.propertyMediaService.getAll(
      request,
    ) as unknown as Promise<QueryPropertyMediaResponse>;
  }

  @GrpcMethod(PROPERTIES_SERVICE_NAME, 'getPropertyMedia')
  async getPropertyMedia(
    request: GetPropertyMediaRequest,
  ): Promise<GetPropertyMediaResponse> {
    const res = await this.propertyMediaService.getById(request);
    if (!res.data)
      throw new RpcException(
        new NotFoundException('Property media not found'),
      );
    return res as unknown as GetPropertyMediaResponse;
  }

  @GrpcMethod(PROPERTIES_SERVICE_NAME, 'createPropertyMedia')
  createPropertyMedia(
    request: CreatePropertyMediaRequest,
  ): Promise<GetPropertyMediaResponse> {
    return this.propertyMediaService.create(
      request,
    ) as unknown as Promise<GetPropertyMediaResponse>;
  }

  @GrpcMethod(PROPERTIES_SERVICE_NAME, 'updatePropertyMedia')
  updatePropertyMedia(
    request: UpdatePropertyMediaRequest,
  ): Promise<GetPropertyMediaResponse> {
    return this.propertyMediaService.update(
      request,
    ) as unknown as Promise<GetPropertyMediaResponse>;
  }

  @GrpcMethod(PROPERTIES_SERVICE_NAME, 'deletePropertyMedia')
  deletePropertyMedia(
    request: DeletePropertyMediaRequest,
  ): Promise<GetPropertyMediaResponse> {
    return this.propertyMediaService.delete(
      request,
    ) as unknown as Promise<GetPropertyMediaResponse>;
  }
}
