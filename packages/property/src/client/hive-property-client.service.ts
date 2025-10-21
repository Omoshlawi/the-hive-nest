/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
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
  PROPERTIES_SERVICE_NAME,
  PropertiesClient,
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
  serviceName: PROPERTIES_SERVICE_NAME,
  name: HIVE_PROPERTY_SERVICE_NAME,
})
export class HivePropertyServiceClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private client: HiveServiceClient) {}
  private loadBalance() {
    const property = this.client.getService<PropertiesClient>();
    if (!property) throw new Error('No service instance');
    return property;
  }
  readonly relationshipTypes = {
    queryRelationshipType: (
      request: QueryRelationshipTypeRequest,
    ): Observable<QueryRelationshipTypeResponse> =>
      this.loadBalance().queryRelationshipType(request),
    getRelationshipType: (
      request: GetRelationshipTypeRequest,
    ): Observable<GetRelationshipTypeResponse> =>
      this.loadBalance().getRelationshipType(request),
    createRelationshipType: (
      request: CreateRelationshipTypeRequest,
    ): Observable<GetRelationshipTypeResponse> =>
      this.loadBalance().createRelationshipType(request),
    updateRelationshipType: (
      request: UpdateRelationshipTypeRequest,
    ): Observable<GetRelationshipTypeResponse> =>
      this.loadBalance().updateRelationshipType(request),
    deleteRelationshipType: (
      request: DeleteRelationshipTypeRequest,
    ): Observable<GetRelationshipTypeResponse> =>
      this.loadBalance().deleteRelationshipType(request),
  };
  readonly relationships = {
    queryRelationship: (
      request: QueryRelationshipRequest,
    ): Observable<QueryRelationshipResponse> =>
      this.loadBalance().queryRelationship(request),
    getRelationship: (
      request: GetRelationshipRequest,
    ): Observable<GetRelationshipResponse> =>
      this.loadBalance().getRelationship(request),
    createRelationship: (
      request: CreateRelationshipRequest,
    ): Observable<GetRelationshipResponse> =>
      this.loadBalance().createRelationship(request),
    updateRelationship: (
      request: UpdateRelationshipRequest,
    ): Observable<GetRelationshipResponse> =>
      this.loadBalance().updateRelationship(request),
    deleteRelationship: (
      request: DeleteRelationshipRequest,
    ): Observable<GetRelationshipResponse> =>
      this.loadBalance().deleteRelationship(request),
  };
  readonly propertyStatusHistory = {
    queryPropertyStatusHistory: (
      request: QueryPropertyStatusHistoryRequest,
    ): Observable<QueryPropertyStatusHistoryResponse> =>
      this.loadBalance().queryPropertyStatusHistory(request),
    getPropertyStatusHistory: (
      request: GetPropertyStatusHistoryRequest,
    ): Observable<GetPropertyStatusHistoryResponse> =>
      this.loadBalance().getPropertyStatusHistory(request),
    createPropertyStatusHistory: (
      request: CreatePropertyStatusHistoryRequest,
    ): Observable<GetPropertyStatusHistoryResponse> =>
      this.loadBalance().createPropertyStatusHistory(request),
    deletePropertyStatusHistory: (
      request: DeletePropertyStatusHistoryRequest,
    ): Observable<GetPropertyStatusHistoryResponse> =>
      this.loadBalance().deletePropertyStatusHistory(request),
  };
  readonly propertyMedia = {
    queryPropertyMedia: (
      request: QueryPropertyMediaRequest,
    ): Observable<QueryPropertyMediaResponse> =>
      this.loadBalance().queryPropertyMedia(request),
    getPropertyMedia: (
      request: GetPropertyMediaRequest,
    ): Observable<GetPropertyMediaResponse> =>
      this.loadBalance().getPropertyMedia(request),
    createPropertyMedia: (
      request: CreatePropertyMediaRequest,
    ): Observable<GetPropertyMediaResponse> =>
      this.loadBalance().createPropertyMedia(request),
    updatePropertyMedia: (
      request: UpdatePropertyMediaRequest,
    ): Observable<GetPropertyMediaResponse> =>
      this.loadBalance().updatePropertyMedia(request),
    deletePropertyMedia: (
      request: DeletePropertyMediaRequest,
    ): Observable<GetPropertyMediaResponse> =>
      this.loadBalance().deletePropertyMedia(request),
  };
  readonly propertyAttributes = {
    queryPropertyAttribute: (
      request: QueryPropertyAttributeRequest,
    ): Observable<QueryPropertyAttributeResponse> =>
      this.loadBalance().queryPropertyAttribute(request),
    getPropertyAttribute: (
      request: GetPropertyAttributeRequest,
    ): Observable<GetPropertyAttributeResponse> =>
      this.loadBalance().getPropertyAttribute(request),
    createPropertyAttribute: (
      request: CreatePropertyAttributeRequest,
    ): Observable<GetPropertyAttributeResponse> =>
      this.loadBalance().createPropertyAttribute(request),
    updatePropertyAttribute: (
      request: UpdatePropertyAttributeRequest,
    ): Observable<GetPropertyAttributeResponse> =>
      this.loadBalance().updatePropertyAttribute(request),
    deletePropertyAttribute: (
      request: DeletePropertyAttributeRequest,
    ): Observable<GetPropertyAttributeResponse> =>
      this.loadBalance().deletePropertyAttribute(request),
  };
  readonly propertyAmenities = {
    queryPropertyAmenity: (
      request: QueryPropertyAmenityRequest,
    ): Observable<QueryPropertyAmenityResponse> =>
      this.loadBalance().queryPropertyAmenity(request),
    getPropertyAmenity: (
      request: GetPropertyAmenityRequest,
    ): Observable<GetPropertyAmenityResponse> =>
      this.loadBalance().getPropertyAmenity(request),
    createPropertyAmenity: (
      request: CreatePropertyAmenityRequest,
    ): Observable<GetPropertyAmenityResponse> =>
      this.loadBalance().createPropertyAmenity(request),
    updatePropertyAmenity: (
      request: UpdatePropertyAmenityRequest,
    ): Observable<GetPropertyAmenityResponse> =>
      this.loadBalance().updatePropertyAmenity(request),
    deletePropertyAmenity: (
      request: DeletePropertyAmenityRequest,
    ): Observable<GetPropertyAmenityResponse> =>
      this.loadBalance().deletePropertyAmenity(request),
  };
  readonly propertyCategories = {
    queryPropertyCategory: (
      request: QueryPropertyCategoryRequest,
    ): Observable<QueryPropertyCategoryResponse> =>
      this.loadBalance().queryPropertyCategory(request),
    getPropertyCategory: (
      request: GetPropertyCategoryRequest,
    ): Observable<GetPropertyCategoryResponse> =>
      this.loadBalance().getPropertyCategory(request),
    createPropertyCategory: (
      request: CreatePropertyCategoryRequest,
    ): Observable<GetPropertyCategoryResponse> =>
      this.loadBalance().createPropertyCategory(request),
    updatePropertyCategory: (
      request: UpdatePropertyCategoryRequest,
    ): Observable<GetPropertyCategoryResponse> =>
      this.loadBalance().updatePropertyCategory(request),
    deletePropertyCategory: (
      request: DeletePropertyCategoryRequest,
    ): Observable<GetPropertyCategoryResponse> =>
      this.loadBalance().deletePropertyCategory(request),
  };

  readonly amenities = {
    queryAmenities: (
      request: QueryAmenityRequest,
    ): Observable<QueryAmenityResponse> =>
      this.loadBalance().queryAmenities(request),
    getAmenity: (request: GetAmenityRequest): Observable<GetAmenityResponse> =>
      this.loadBalance().getAmenity(request),
    createAmenity: (
      request: CreateAmenityRequest,
    ): Observable<GetAmenityResponse> =>
      this.loadBalance().createAmenity(request),
    updateAmenity: (
      request: UpdateAmenityRequest,
    ): Observable<GetAmenityResponse> =>
      this.loadBalance().updateAmenity(request),
    deleteAmenity: (
      request: DeleteAmenityRequest,
    ): Observable<GetAmenityResponse> =>
      this.loadBalance().deleteAmenity(request),
  };
  readonly categories = {
    queryCategories: (
      request: QueryCategoryRequest,
    ): Observable<QueryCategoryResponse> =>
      this.loadBalance().queryCategories(request),
    getCategory: (
      request: GetCategoryRequest,
    ): Observable<GetCategoryResponse> =>
      this.loadBalance().getCategory(request),
    createCategory: (
      request: CreateCategoryRequest,
    ): Observable<GetCategoryResponse> =>
      this.loadBalance().createCategory(request),
    updateCategory: (
      request: UpdateCategoryRequest,
    ): Observable<GetCategoryResponse> =>
      this.loadBalance().updateCategory(request),
    deleteCategory: (
      request: DeleteCategoryRequest,
    ): Observable<GetCategoryResponse> =>
      this.loadBalance().deleteCategory(request),
  };
  readonly attributeTypes = {
    queryAttributeTypes: (
      request: QueryAttributeTypeRequest,
    ): Observable<QueryAttributeTypeResponse> =>
      this.loadBalance().queryAttributeTypes(request),
    getAttributeType: (
      request: GetAttributeTypeRequest,
    ): Observable<GetAttributeTypeResponse> =>
      this.loadBalance().getAttributeType(request),
    createAttributeType: (
      request: CreateAttributeTypeRequest,
    ): Observable<GetAttributeTypeResponse> =>
      this.loadBalance().createAttributeType(request),
    updateAttributeType: (
      request: UpdateAttributeTypeRequest,
    ): Observable<GetAttributeTypeResponse> =>
      this.loadBalance().updateAttributeType(request),
    deleteAttributeType: (
      request: DeleteAttributeTypeRequest,
    ): Observable<GetAttributeTypeResponse> =>
      this.loadBalance().deleteAttributeType(request),
  };

  readonly properties = {
    queryProperties: (
      request: QueryPropertyRequest,
    ): Observable<QueryPropertyResponse> =>
      this.loadBalance().queryProperties(request),
    getProperty: (
      request: GetPropertyRequest,
    ): Observable<GetPropertyResponse> =>
      this.loadBalance().getProperty(request),
    createProperty: (
      request: CreatePropertyRequest,
    ): Observable<GetPropertyResponse> =>
      this.loadBalance().createProperty(request),
    updateProperty: (
      request: UpdatePropertyRequest,
    ): Observable<GetPropertyResponse> =>
      this.loadBalance().updateProperty(request),
    deleteProperty: (
      request: DeletePropertyRequest,
    ): Observable<GetPropertyResponse> =>
      this.loadBalance().deleteProperty(request),
  };

  onModuleInit() {
    return this.client.onModuleInit();
  }
  onModuleDestroy() {
    return this.client.onModuleDestroy();
  }
}
