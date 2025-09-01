import {
  CreateAmenityRequest,
  DeleteAmenityRequest,
  GetAmenityRequest,
  GetAmenityResponse,
  PROPERTY_SERVICE_NAME,
  QueryAmenityRequest,
  QueryAmenityResponse,
  UpdateAmenityRequest,
} from '@hive/property';
import { Controller, NotFoundException } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { AmenitiesService } from './amenities.service';

@Controller('amenities')
export class AmenitiesController {
  constructor(private readonly amenitiesService: AmenitiesService) {}

  @GrpcMethod(PROPERTY_SERVICE_NAME, 'queryAmenities')
  queryAmenities(request: QueryAmenityRequest): Promise<QueryAmenityResponse> {
    return this.amenitiesService.getAll(
      request,
    ) as unknown as Promise<QueryAmenityResponse>;
  }
  @GrpcMethod(PROPERTY_SERVICE_NAME, 'getAmenity')
  async getAmenity(request: GetAmenityRequest): Promise<GetAmenityResponse> {
    const res = await this.amenitiesService.getById(request);
    if (!res.data)
      throw new RpcException(new NotFoundException('Amenity not found'));
    return res as unknown as GetAmenityResponse;
  }
  @GrpcMethod(PROPERTY_SERVICE_NAME, 'createAmenity')
  createAmenity(
    request: CreateAmenityRequest,
  ):
    | Promise<GetAmenityResponse>
    | Observable<GetAmenityResponse>
    | GetAmenityResponse {
    return this.amenitiesService.create(
      request,
    ) as unknown as GetAmenityResponse;
  }
  @GrpcMethod(PROPERTY_SERVICE_NAME, 'updateAmenity')
  updateAmenity(
    request: UpdateAmenityRequest,
  ):
    | Promise<GetAmenityResponse>
    | Observable<GetAmenityResponse>
    | GetAmenityResponse {
    return this.amenitiesService.update(
      request,
    ) as unknown as GetAmenityResponse;
  }
  @GrpcMethod(PROPERTY_SERVICE_NAME, 'deleteAmenity')
  deleteAmenity(
    request: DeleteAmenityRequest,
  ):
    | Promise<GetAmenityResponse>
    | Observable<GetAmenityResponse>
    | GetAmenityResponse {
    return this.amenitiesService.delete(
      request,
    ) as unknown as GetAmenityResponse;
  }
}
