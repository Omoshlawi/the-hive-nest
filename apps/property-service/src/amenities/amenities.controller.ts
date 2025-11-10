import {
  CreateAmenityRequest,
  DeleteAmenityRequest,
  GetAmenityRequest,
  GetAmenityResponse,
  IAmenitiesController,
  PROPERTIES_SERVICE_NAME,
  QueryAmenityRequest,
  QueryAmenityResponse,
  UpdateAmenityRequest,
} from '@hive/property';
import { Controller, NotFoundException } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { AmenitiesService } from './amenities.service';

@Controller('amenities')
export class AmenitiesController implements IAmenitiesController{
  constructor(private readonly amenitiesService: AmenitiesService) {}

  @GrpcMethod(PROPERTIES_SERVICE_NAME, 'queryAmenities')
  queryAmenities(request: QueryAmenityRequest): Promise<QueryAmenityResponse> {
    return this.amenitiesService.getAll(
      request,
    ) as unknown as Promise<QueryAmenityResponse>;
  }
  @GrpcMethod(PROPERTIES_SERVICE_NAME, 'getAmenity')
  async getAmenity(request: GetAmenityRequest): Promise<GetAmenityResponse> {
    const res = await this.amenitiesService.getById(request);
    if (!res.data)
      throw new RpcException(new NotFoundException('Amenity not found'));
    return res as unknown as GetAmenityResponse;
  }
  @GrpcMethod(PROPERTIES_SERVICE_NAME, 'createAmenity')
  createAmenity(request: CreateAmenityRequest): Promise<GetAmenityResponse> {
    return this.amenitiesService.create(
      request,
    ) as unknown as Promise<GetAmenityResponse>;
  }
  @GrpcMethod(PROPERTIES_SERVICE_NAME, 'updateAmenity')
  updateAmenity(request: UpdateAmenityRequest): Promise<GetAmenityResponse> {
    return this.amenitiesService.update(
      request,
    ) as unknown as Promise<GetAmenityResponse>;
  }
  @GrpcMethod(PROPERTIES_SERVICE_NAME, 'deleteAmenity')
  deleteAmenity(request: DeleteAmenityRequest): Promise<GetAmenityResponse> {
    return this.amenitiesService.delete(
      request,
    ) as unknown as Promise<GetAmenityResponse>;
  }
}
