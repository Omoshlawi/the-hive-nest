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
import {
  QueryRelationshipRequest,
  QueryRelationshipResponse,
  GetRelationshipRequest,
  GetRelationshipResponse,
  CreateRelationshipRequest,
  UpdateRelationshipRequest,
  DeleteRelationshipRequest,
  QueryPropertyStatusHistoryRequest,
  QueryPropertyStatusHistoryResponse,
  GetPropertyStatusHistoryRequest,
  GetPropertyStatusHistoryResponse,
  CreatePropertyStatusHistoryRequest,
  DeletePropertyStatusHistoryRequest,
  QueryPropertyMediaRequest,
  QueryPropertyMediaResponse,
  GetPropertyMediaRequest,
  GetPropertyMediaResponse,
  CreatePropertyMediaRequest,
  UpdatePropertyMediaRequest,
  DeletePropertyMediaRequest,
  QueryPropertyAttributeRequest,
  QueryPropertyAttributeResponse,
  GetPropertyAttributeRequest,
  GetPropertyAttributeResponse,
  CreatePropertyAttributeRequest,
  UpdatePropertyAttributeRequest,
  DeletePropertyAttributeRequest,
  QueryPropertyAmenityRequest,
  QueryPropertyAmenityResponse,
  GetPropertyAmenityRequest,
  GetPropertyAmenityResponse,
  CreatePropertyAmenityRequest,
  UpdatePropertyAmenityRequest,
  DeletePropertyAmenityRequest,
  QueryPropertyCategoryRequest,
  QueryPropertyCategoryResponse,
  GetPropertyCategoryRequest,
  GetPropertyCategoryResponse,
  CreatePropertyCategoryRequest,
  UpdatePropertyCategoryRequest,
  DeletePropertyCategoryRequest,
} from 'types/property.message';
import {
  QueryRelationshipTypeRequest,
  QueryRelationshipTypeResponse,
  GetRelationshipTypeRequest,
  GetRelationshipTypeResponse,
  CreateRelationshipTypeRequest,
  UpdateRelationshipTypeRequest,
  DeleteRelationshipTypeRequest,
} from 'types/relationship-type.message';
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
  queryRelationshipType(
    request: QueryRelationshipTypeRequest,
  ): Observable<QueryRelationshipTypeResponse> {
    const property = this.loadBalance();
    return property.queryRelationshipType(request);
  }
  getRelationshipType(
    request: GetRelationshipTypeRequest,
  ): Observable<GetRelationshipTypeResponse> {
    const property = this.loadBalance();
    return property.getRelationshipType(request);
  }
  createRelationshipType(
    request: CreateRelationshipTypeRequest,
  ): Observable<GetRelationshipTypeResponse> {
    const property = this.loadBalance();
    return property.createRelationshipType(request);
  }
  updateRelationshipType(
    request: UpdateRelationshipTypeRequest,
  ): Observable<GetRelationshipTypeResponse> {
    const property = this.loadBalance();
    return property.updateRelationshipType(request);
  }
  deleteRelationshipType(
    request: DeleteRelationshipTypeRequest,
  ): Observable<GetRelationshipTypeResponse> {
    const property = this.loadBalance();
    return property.deleteRelationshipType(request);
  }
  queryRelationship(
    request: QueryRelationshipRequest,
  ): Observable<QueryRelationshipResponse> {
    const property = this.loadBalance();
    return property.queryRelationship(request);
  }
  getRelationship(
    request: GetRelationshipRequest,
  ): Observable<GetRelationshipResponse> {
    const property = this.loadBalance();
    return property.getRelationship(request);
  }
  createRelationship(
    request: CreateRelationshipRequest,
  ): Observable<GetRelationshipResponse> {
    const property = this.loadBalance();
    return property.createRelationship(request);
  }
  updateRelationship(
    request: UpdateRelationshipRequest,
  ): Observable<GetRelationshipResponse> {
    const property = this.loadBalance();
    return property.updateRelationship(request);
  }
  deleteRelationship(
    request: DeleteRelationshipRequest,
  ): Observable<GetRelationshipResponse> {
    const property = this.loadBalance();
    return property.deleteRelationship(request);
  }
  queryPropertyStatusHistory(
    request: QueryPropertyStatusHistoryRequest,
  ): Observable<QueryPropertyStatusHistoryResponse> {
    const property = this.loadBalance();
    return property.queryPropertyStatusHistory(request);
  }
  getPropertyStatusHistory(
    request: GetPropertyStatusHistoryRequest,
  ): Observable<GetPropertyStatusHistoryResponse> {
    const property = this.loadBalance();
    return property.getPropertyStatusHistory(request);
  }
  createPropertyStatusHistory(
    request: CreatePropertyStatusHistoryRequest,
  ): Observable<GetPropertyStatusHistoryResponse> {
    const property = this.loadBalance();
    return property.createPropertyStatusHistory(request);
  }
  deletePropertyStatusHistory(
    request: DeletePropertyStatusHistoryRequest,
  ): Observable<GetPropertyStatusHistoryResponse> {
    const property = this.loadBalance();
    return property.deletePropertyStatusHistory(request);
  }
  queryPropertyMedia(
    request: QueryPropertyMediaRequest,
  ): Observable<QueryPropertyMediaResponse> {
    const property = this.loadBalance();
    return property.queryPropertyMedia(request);
  }
  getPropertyMedia(
    request: GetPropertyMediaRequest,
  ): Observable<GetPropertyMediaResponse> {
    const property = this.loadBalance();
    return property.getPropertyMedia(request);
  }
  createPropertyMedia(
    request: CreatePropertyMediaRequest,
  ): Observable<GetPropertyMediaResponse> {
    const property = this.loadBalance();
    return property.createPropertyMedia(request);
  }
  updatePropertyMedia(
    request: UpdatePropertyMediaRequest,
  ): Observable<GetPropertyMediaResponse> {
    const property = this.loadBalance();
    return property.updatePropertyMedia(request);
  }
  deletePropertyMedia(
    request: DeletePropertyMediaRequest,
  ): Observable<GetPropertyMediaResponse> {
    const property = this.loadBalance();
    return property.deletePropertyMedia(request);
  }
  queryPropertyAttribute(
    request: QueryPropertyAttributeRequest,
  ): Observable<QueryPropertyAttributeResponse> {
    const property = this.loadBalance();
    return property.queryPropertyAttribute(request);
  }
  getPropertyAttribute(
    request: GetPropertyAttributeRequest,
  ): Observable<GetPropertyAttributeResponse> {
    const property = this.loadBalance();
    return property.getPropertyAttribute(request);
  }
  createPropertyAttribute(
    request: CreatePropertyAttributeRequest,
  ): Observable<GetPropertyAttributeResponse> {
    const property = this.loadBalance();
    return property.createPropertyAttribute(request);
  }
  updatePropertyAttribute(
    request: UpdatePropertyAttributeRequest,
  ): Observable<GetPropertyAttributeResponse> {
    const property = this.loadBalance();
    return property.updatePropertyAttribute(request);
  }
  deletePropertyAttribute(
    request: DeletePropertyAttributeRequest,
  ): Observable<GetPropertyAttributeResponse> {
    const property = this.loadBalance();
    return property.deletePropertyAttribute(request);
  }
  queryPropertyAmenity(
    request: QueryPropertyAmenityRequest,
  ): Observable<QueryPropertyAmenityResponse> {
    const property = this.loadBalance();
    return property.queryPropertyAmenity(request);
  }
  getPropertyAmenity(
    request: GetPropertyAmenityRequest,
  ): Observable<GetPropertyAmenityResponse> {
    const property = this.loadBalance();
    return property.getPropertyAmenity(request);
  }
  createPropertyAmenity(
    request: CreatePropertyAmenityRequest,
  ): Observable<GetPropertyAmenityResponse> {
    const property = this.loadBalance();
    return property.createPropertyAmenity(request);
  }
  updatePropertyAmenity(
    request: UpdatePropertyAmenityRequest,
  ): Observable<GetPropertyAmenityResponse> {
    const property = this.loadBalance();
    return property.updatePropertyAmenity(request);
  }
  deletePropertyAmenity(
    request: DeletePropertyAmenityRequest,
  ): Observable<GetPropertyAmenityResponse> {
    const property = this.loadBalance();
    return property.deletePropertyAmenity(request);
  }
  queryPropertyCategory(
    request: QueryPropertyCategoryRequest,
  ): Observable<QueryPropertyCategoryResponse> {
    const property = this.loadBalance();
    return property.queryPropertyCategory(request);
  }
  getPropertyCategory(
    request: GetPropertyCategoryRequest,
  ): Observable<GetPropertyCategoryResponse> {
    const property = this.loadBalance();
    return property.getPropertyCategory(request);
  }
  createPropertyCategory(
    request: CreatePropertyCategoryRequest,
  ): Observable<GetPropertyCategoryResponse> {
    const property = this.loadBalance();
    return property.createPropertyCategory(request);
  }
  updatePropertyCategory(
    request: UpdatePropertyCategoryRequest,
  ): Observable<GetPropertyCategoryResponse> {
    const property = this.loadBalance();
    return property.updatePropertyCategory(request);
  }
  deletePropertyCategory(
    request: DeletePropertyCategoryRequest,
  ): Observable<GetPropertyCategoryResponse> {
    const property = this.loadBalance();
    return property.deletePropertyCategory(request);
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
    const property = this.loadBalance();
    return property.queryProperties(request);
  }
  getProperty(request: GetPropertyRequest): Observable<GetPropertyResponse> {
    const property = this.loadBalance();
    return property.getProperty(request);
  }
  createProperty(
    request: CreatePropertyRequest,
  ): Observable<GetPropertyResponse> {
    const property = this.loadBalance();
    return property.createProperty(request);
  }
  updateProperty(
    request: UpdatePropertyRequest,
  ): Observable<GetPropertyResponse> {
    const property = this.loadBalance();
    return property.updateProperty(request);
  }
  deleteProperty(
    request: DeletePropertyRequest,
  ): Observable<GetPropertyResponse> {
    const property = this.loadBalance();
    return property.deleteProperty(request);
  }
  onModuleInit() {
    return this.client.onModuleInit();
  }
  onModuleDestroy() {
    return this.client.onModuleDestroy();
  }
}
