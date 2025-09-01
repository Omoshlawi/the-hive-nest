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
export class HivePropertyServiceClient
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
    const property = this.loadBalance();
    return property.queryCategories(request);
  }
  getCategory(request: GetCategoryRequest): Observable<GetCategoryResponse> {
    const property = this.loadBalance();
    return property.getCategory(request);
  }
  createCategory(
    request: CreateCategoryRequest,
  ): Observable<GetCategoryResponse> {
    const property = this.loadBalance();
    return property.createCategory(request);
  }
  updateCategory(
    request: UpdateCategoryRequest,
  ): Observable<GetCategoryResponse> {
    const property = this.loadBalance();
    return property.updateCategory(request);
  }
  deleteCategory(
    request: DeleteCategoryRequest,
  ): Observable<GetCategoryResponse> {
    const property = this.loadBalance();
    return property.deleteCategory(request);
  }
  queryAttributeTypes(
    request: QueryAttributeTypeRequest,
  ): Observable<QueryAttributeTypeResponse> {
    const property = this.loadBalance();
    return property.queryAttributeTypes(request);
  }
  getAttributeType(
    request: GetAttributeTypeRequest,
  ): Observable<GetAttributeTypeResponse> {
    const property = this.loadBalance();
    return property.getAttributeType(request);
  }
  createAttributeType(
    request: CreateAttributeTypeRequest,
  ): Observable<GetAttributeTypeResponse> {
    const property = this.loadBalance();
    return property.createAttributeType(request);
  }
  updateAttributeType(
    request: UpdateAttributeTypeRequest,
  ): Observable<GetAttributeTypeResponse> {
    const property = this.loadBalance();
    return property.updateAttributeType(request);
  }
  deleteAttributeType(
    request: DeleteAttributeTypeRequest,
  ): Observable<GetAttributeTypeResponse> {
    const property = this.loadBalance();
    return property.deleteAttributeType(request);
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
