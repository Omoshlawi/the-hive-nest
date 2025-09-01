import {
  Amenity,
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
import { omit } from 'lodash';

@Controller('amenities')
export class AmenitiesController {
  constructor(private readonly amenitiesService: AmenitiesService) {}

  @GrpcMethod(PROPERTY_SERVICE_NAME, 'queryAmenities')
  queryAmenities(request: QueryAmenityRequest): Promise<QueryAmenityResponse> {
    return this.amenitiesService.getAll({
      limit: request?.queryBuilder?.limit,
      orderBy: request?.queryBuilder?.orderBy,
      v: request.queryBuilder?.v,
      page: request?.queryBuilder?.page,
      includeVoided: request.includeVoided ?? false,
      organizationId: request.organizationId,
      search: request.search,
    }) as unknown as Promise<QueryAmenityResponse>;
  }
  @GrpcMethod(PROPERTY_SERVICE_NAME, 'getAmenity')
  async getAmenity(request: GetAmenityRequest): Promise<GetAmenityResponse> {
    const res = await this.amenitiesService.getById(request.id, {
      v: request?.queryBuilder?.v,
    });
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
    return this.amenitiesService.create({
      ...(omit(request, 'queryBuilder') as any),
      v: request?.queryBuilder?.v,
    }) as unknown as GetAmenityResponse;
  }
  @GrpcMethod(PROPERTY_SERVICE_NAME, 'updateAmenity')
  updateAmenity(
    request: UpdateAmenityRequest,
  ):
    | Promise<GetAmenityResponse>
    | Observable<GetAmenityResponse>
    | GetAmenityResponse {
    return this.amenitiesService.update(request.id, {
      ...omit(request, ['id', 'queryBuilder']),
      v: request?.queryBuilder?.v,
    }) as unknown as GetAmenityResponse;
  }
  @GrpcMethod(PROPERTY_SERVICE_NAME, 'deleteAmenity')
  deleteAmenity(
    request: DeleteAmenityRequest,
  ):
    | Promise<GetAmenityResponse>
    | Observable<GetAmenityResponse>
    | GetAmenityResponse {
    return this.amenitiesService.delete(request.id, {
      purge: request.purge ?? false,
    }) as unknown as GetAmenityResponse;
  }
}
