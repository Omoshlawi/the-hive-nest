import { PropertiesController } from './property.service';

export * from './property.service';
export {
  CreateAmenityRequest,
  DeleteAmenityRequest,
  GetAmenityRequest,
  GetAmenityResponse,
  QueryAmenityRequest,
  QueryAmenityResponse,
  UpdateAmenityRequest,
} from './amenity.message';
export {
  CreatePropertyRequest,
  DeletePropertyRequest,
  GetPropertyRequest,
  GetPropertyResponse,
  QueryPropertyRequest,
  QueryPropertyResponse,
  UpdatePropertyRequest,
  CreatePropertyAmenityRequest,
  CreatePropertyAttributeRequest,
  CreatePropertyCategoryRequest,
  CreatePropertyMediaRequest,
  CreatePropertyMediaRequest_MetadataEntry,
  CreatePropertyStatusHistoryRequest,
  CreateRelationshipRequest,
  DeletePropertyAmenityRequest,
  DeletePropertyAttributeRequest,
  DeletePropertyCategoryRequest,
  DeletePropertyMediaRequest,
  DeletePropertyStatusHistoryRequest,
  DeleteRelationshipRequest,
  GetPropertyAmenityRequest,
  GetPropertyAmenityResponse,
  GetPropertyAttributeRequest,
  GetPropertyAttributeResponse,
  GetPropertyCategoryRequest,
  GetPropertyCategoryResponse,
  GetPropertyMediaRequest,
  GetPropertyMediaResponse,
  GetPropertyStatusHistoryRequest,
  GetPropertyStatusHistoryResponse,
  GetRelationshipRequest,
  GetRelationshipResponse,
  QueryPropertyAmenityRequest,
  QueryPropertyAmenityResponse,
  QueryPropertyAttributeRequest,
  QueryPropertyAttributeResponse,
  QueryPropertyCategoryRequest,
  QueryPropertyCategoryResponse,
  QueryPropertyMediaRequest,
  QueryPropertyMediaResponse,
  QueryPropertyStatusHistoryRequest,
  QueryPropertyStatusHistoryResponse,
  QueryRelationshipRequest,
  QueryRelationshipResponse,
  UpdatePropertyAmenityRequest,
  UpdatePropertyAttributeRequest,
  UpdatePropertyCategoryRequest,
  UpdatePropertyMediaRequest,
  UpdatePropertyMediaRequest_MetadataEntry,
  UpdateRelationshipRequest,
} from './property.message';
export {
  Empty,
  Icon,
  QueryBuilder,
  DeleteRequest,
  GetRequest,
} from './common.message';
export {
  CreateAttributeTypeRequest,
  DeleteAttributeTypeRequest,
  GetAttributeTypeRequest,
  GetAttributeTypeResponse,
  QueryAttributeTypeRequest,
  QueryAttributeTypeResponse,
  UpdateAttributeTypeRequest,
} from './attribute-type.message';
export {
  CreateCategoryRequest,
  DeleteCategoryRequest,
  GetCategoryRequest,
  GetCategoryResponse,
  QueryCategoryRequest,
  QueryCategoryResponse,
  UpdateCategoryRequest,
} from './category.message';

export {
  Address,
  Amenity,
  AttributeType,
  Category,
  Organization,
  Property,
  PropertyAmenity,
  PropertyAttribute,
  PropertyCategory,
  PropertyMedia,
  PropertyMedia_MetadataEntry,
  PropertyStatusHistory,
  Relationship,
  RelationshipType,
} from './property.models';

export {
  CreateRelationshipTypeRequest,
  DeleteRelationshipTypeRequest,
  GetRelationshipTypeRequest,
  GetRelationshipTypeResponse,
  QueryRelationshipTypeRequest,
  QueryRelationshipTypeResponse,
  UpdateRelationshipTypeRequest,
} from './relationship-type.message';

export type IAmenitiesController = Pick<
  PropertiesController,
  | 'queryAmenities'
  | 'getAmenity'
  | 'createAmenity'
  | 'updateAmenity'
  | 'deleteAmenity'
>;

export type ICategoriesController = Pick<
  PropertiesController,
  | 'queryCategories'
  | 'getCategory'
  | 'createCategory'
  | 'updateCategory'
  | 'deleteCategory'
>;

export type IAttributeTypesController = Pick<
  PropertiesController,
  | 'queryAttributeTypes'
  | 'getAttributeType'
  | 'createAttributeType'
  | 'updateAttributeType'
  | 'deleteAttributeType'
>;

export type IPropertiesController = Pick<
  PropertiesController,
  | 'queryProperties'
  | 'getProperty'
  | 'createProperty'
  | 'updateProperty'
  | 'deleteProperty'
>;

export type IRelationshipTypesController = Pick<
  PropertiesController,
  | 'queryRelationshipType'
  | 'getRelationshipType'
  | 'createRelationshipType'
  | 'updateRelationshipType'
  | 'deleteRelationshipType'
>;

export type IRelationshipsController = Pick<
  PropertiesController,
  | 'queryRelationship'
  | 'getRelationship'
  | 'createRelationship'
  | 'updateRelationship'
  | 'deleteRelationship'
>;

export type IPropertyStatusHistoryController = Pick<
  PropertiesController,
  | 'queryPropertyStatusHistory'
  | 'getPropertyStatusHistory'
  | 'createPropertyStatusHistory'
  | 'deletePropertyStatusHistory'
>;

export type IPropertyMediaController = Pick<
  PropertiesController,
  | 'queryPropertyMedia'
  | 'getPropertyMedia'
  | 'createPropertyMedia'
  | 'updatePropertyMedia'
  | 'deletePropertyMedia'
>;

export type IPropertyAttributeController = Pick<
  PropertiesController,
  | 'queryPropertyAttribute'
  | 'getPropertyAttribute'
  | 'createPropertyAttribute'
  | 'updatePropertyAttribute'
  | 'deletePropertyAttribute'
>;

export type IPropertyAmenityController = Pick<
  PropertiesController,
  | 'queryPropertyAmenity'
  | 'getPropertyAmenity'
  | 'createPropertyAmenity'
  | 'updatePropertyAmenity'
  | 'deletePropertyAmenity'
>;

export type IPropertyCategoryController = Pick<
  PropertiesController,
  | 'queryPropertyCategory'
  | 'getPropertyCategory'
  | 'createPropertyCategory'
  | 'updatePropertyCategory'
  | 'deletePropertyCategory'
>;
