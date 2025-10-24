import { ReferencesController } from './reference.service';

export {
  CreateIdentifierSequenceRequest,
  GetIdentifierSequenceResponse,
  QueryIdentifierSequenceRequest,
  QueryIdentifierSequenceResponse,
  CreateIdentifierSequenceResponse,
  GeneratedIdentifier,
} from './reference.message';
export {
  IdentifierSequence,
  Address,
  AddressHierarchy,
  Organization,
  User,
} from './reference.model';
export {
  HIVE_REFERENCE_V1_PACKAGE_NAME,
  REFERENCES_SERVICE_NAME,
  ReferencesClient,
  ReferencesController,
  ReferencesControllerMethods,
} from './reference.service';
export {
  DeleteRequest,
  Empty,
  GetRequest,
  QueryBuilder,
  RequestContext,
} from './common.message';

export {
  CreateAddressRequest,
  GetAddressResponse,
  QueryAddressRequest,
  QueryAddressResponse,
  UpdateAddressRequest,
} from './address.message';

export {
  GetAddressHierarchyResponse,
  QueryAddressHierarchyRequest,
  QueryAddressHierarchyResponse,
} from './address-hierarchy.message';

export type IAddressController = Pick<
  ReferencesController,
  | 'queryAddress'
  | 'getAddress'
  | 'createAddress'
  | 'updateAddress'
  | 'deleteAddress'
>;

export type IAddressHierarchyController = Pick<
  ReferencesController,
  'queryAddressHierarchy' | 'deleteAddressHierarchy'
>;
export type IIdentifierSequenceController = Pick<
  ReferencesController,
  | 'queryIdentifierSequence'
  | 'createIdentifierSequence'
  | 'deleteIdentifierSequence'
>;
