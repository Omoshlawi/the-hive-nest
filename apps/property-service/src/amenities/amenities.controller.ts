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
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';

@Controller('amenities')
export class AmenitiesController {
  @GrpcMethod(PROPERTY_SERVICE_NAME)
  queryAmenities(
    request: QueryAmenityRequest,
  ):
    | Promise<QueryAmenityResponse>
    | Observable<QueryAmenityResponse>
    | QueryAmenityResponse {
    throw new Error('Method not implemented.');
  }
  @GrpcMethod(PROPERTY_SERVICE_NAME)
  getAmenity(
    request: GetAmenityRequest,
  ):
    | Promise<GetAmenityResponse>
    | Observable<GetAmenityResponse>
    | GetAmenityResponse {
    throw new Error('Method not implemented.');
  }
  @GrpcMethod(PROPERTY_SERVICE_NAME)
  createAmenity(
    request: CreateAmenityRequest,
  ):
    | Promise<GetAmenityResponse>
    | Observable<GetAmenityResponse>
    | GetAmenityResponse {
    throw new Error('Method not implemented.');
  }
  @GrpcMethod(PROPERTY_SERVICE_NAME)
  updateAmenity(
    request: UpdateAmenityRequest,
  ):
    | Promise<GetAmenityResponse>
    | Observable<GetAmenityResponse>
    | GetAmenityResponse {
    throw new Error('Method not implemented.');
  }
  @GrpcMethod(PROPERTY_SERVICE_NAME)
  deleteAmenity(
    request: DeleteAmenityRequest,
  ):
    | Promise<GetAmenityResponse>
    | Observable<GetAmenityResponse>
    | GetAmenityResponse {
    throw new Error('Method not implemented.');
  }
}
