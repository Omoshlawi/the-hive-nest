import { HiveService, HiveServiceClient } from '@hive/registry';
import { HIVE_PROPERTY_SERVICE_NAME, PROPERTY_PACKAGE } from '../constants';
import {
  CreateAmenityRequest,
  CreateAttributeTypeRequest,
  CreateCategoryRequest,
  CreatePropertyRequest,
  DeleteAmenityRequest,
  DeleteAttributeTypeRequest,
  DeleteCategoryRequest,
  DeletePropertyRequest,
  GetAmenityRequest,
  GetAmenityResponse,
  GetAttributeTypeRequest,
  GetAttributeTypeResponse,
  GetCategoryRequest,
  GetCategoryResponse,
  GetPropertyRequest,
  GetPropertyResponse,
  PROPERTY_SERVICE_NAME,
  PropertyClient,
  QueryAmenityRequest,
  QueryAmenityResponse,
  QueryAttributeTypeRequest,
  QueryAttributeTypeResponse,
  QueryCategoryRequest,
  QueryCategoryResponse,
  QueryPropertyRequest,
  QueryPropertyResponse,
  UpdateAmenityRequest,
  UpdateAttributeTypeRequest,
  UpdateCategoryRequest,
  UpdatePropertyRequest,
} from '../types';
import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Observable } from 'rxjs';
@HiveService({
  package: PROPERTY_PACKAGE.V1.NAME,
  protoPath: PROPERTY_PACKAGE.V1.PROTO_PATH,
  version: '0.0.1',
  serviceName: PROPERTY_SERVICE_NAME,
  name: HIVE_PROPERTY_SERVICE_NAME,
})
export class HiveProperyServiceClient
  implements OnModuleInit, OnModuleDestroy, PropertyClient
{
  constructor(private client: HiveServiceClient) {}

  private loadBalance() {
    const property = this.client.getService<PropertyClient>();
    if (!property) throw new Error('No service instance');
    return property;
  }

  queryAmenities(
    request: QueryAmenityRequest,
  ): Observable<QueryAmenityResponse> {
    const property = this.loadBalance();
    return property.queryAmenities(request);
  }
  getAmenity(request: GetAmenityRequest): Observable<GetAmenityResponse> {
    const property = this.loadBalance();
    return property.getAmenity(request);
  }
  createAmenity(request: CreateAmenityRequest): Observable<GetAmenityResponse> {
    const property = this.loadBalance();
    return property.createAmenity(request);
  }
  updateAmenity(request: UpdateAmenityRequest): Observable<GetAmenityResponse> {
    const property = this.loadBalance();
    return property.updateAmenity(request);
  }
  deleteAmenity(request: DeleteAmenityRequest): Observable<GetAmenityResponse> {
    const property = this.loadBalance();
    return property.deleteAmenity(request);
  }
  queryCategories(
    request: QueryCategoryRequest,
  ): Observable<QueryCategoryResponse> {
    throw new Error('Method not implemented.');
  }
  getCategory(request: GetCategoryRequest): Observable<GetCategoryResponse> {
    throw new Error('Method not implemented.');
  }
  createCategory(
    request: CreateCategoryRequest,
  ): Observable<GetCategoryResponse> {
    throw new Error('Method not implemented.');
  }
  updateCategory(
    request: UpdateCategoryRequest,
  ): Observable<GetCategoryResponse> {
    throw new Error('Method not implemented.');
  }
  deleteCategory(
    request: DeleteCategoryRequest,
  ): Observable<GetCategoryResponse> {
    throw new Error('Method not implemented.');
  }
  queryAttributeTypes(
    request: QueryAttributeTypeRequest,
  ): Observable<QueryAttributeTypeResponse> {
    throw new Error('Method not implemented.');
  }
  getAttributeType(
    request: GetAttributeTypeRequest,
  ): Observable<GetAttributeTypeResponse> {
    throw new Error('Method not implemented.');
  }
  createAttributeType(
    request: CreateAttributeTypeRequest,
  ): Observable<GetAttributeTypeResponse> {
    throw new Error('Method not implemented.');
  }
  updateAttributeType(
    request: UpdateAttributeTypeRequest,
  ): Observable<GetAttributeTypeResponse> {
    throw new Error('Method not implemented.');
  }
  deleteAttributeType(
    request: DeleteAttributeTypeRequest,
  ): Observable<GetAttributeTypeResponse> {
    throw new Error('Method not implemented.');
  }
  queryProperties(
    request: QueryPropertyRequest,
  ): Observable<QueryPropertyResponse> {
    throw new Error('Method not implemented.');
  }
  getProperty(request: GetPropertyRequest): Observable<GetPropertyResponse> {
    throw new Error('Method not implemented.');
  }
  createProperty(
    request: CreatePropertyRequest,
  ): Observable<GetPropertyResponse> {
    throw new Error('Method not implemented.');
  }
  updateProperty(
    request: UpdatePropertyRequest,
  ): Observable<GetPropertyResponse> {
    throw new Error('Method not implemented.');
  }
  deleteProperty(
    request: DeletePropertyRequest,
  ): Observable<GetPropertyResponse> {
    throw new Error('Method not implemented.');
  }
  onModuleInit() {
    return this.client.onModuleInit();
  }
  onModuleDestroy() {
    return this.client.onModuleDestroy();
  }
}
