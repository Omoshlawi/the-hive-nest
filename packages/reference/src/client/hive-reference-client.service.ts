/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { HiveService, HiveServiceClient } from '@hive/registry';
import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Observable } from 'rxjs';

import { DeleteRequest, GetRequest } from '../types/common.message';
import { HIVE_REFERENCE_SERVICE_NAME, REFERENCE_PACKAGE } from '../constants';
import {
  CreateAddressRequest,
  CreateIdentifierSequenceRequest,
  CreateIdentifierSequenceResponse,
  GetAddressHierarchyResponse,
  GetAddressResponse,
  GetIdentifierSequenceResponse,
  QueryAddressHierarchyRequest,
  QueryAddressHierarchyResponse,
  QueryAddressRequest,
  QueryAddressResponse,
  QueryIdentifierSequenceRequest,
  QueryIdentifierSequenceResponse,
  REFERENCES_SERVICE_NAME,
  ReferencesClient,
  UpdateAddressRequest,
} from '../types';

@HiveService({
  package: REFERENCE_PACKAGE.V1.NAME,
  protoPath: REFERENCE_PACKAGE.V1.PROTO_PATH,
  version: '0.0.1',
  serviceName: REFERENCES_SERVICE_NAME,
  name: HIVE_REFERENCE_SERVICE_NAME,
})
export class HiveReferencesServiceClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private client: HiveServiceClient) {}

  readonly identifierSequence: Pick<
    ReferencesClient,
    | 'queryIdentifierSequence'
    | 'createIdentifierSequence'
    | 'deleteIdentifierSequence'
  > = {
    queryIdentifierSequence: (
      request: QueryIdentifierSequenceRequest,
    ): Observable<QueryIdentifierSequenceResponse> =>
      this.loadBalance().queryIdentifierSequence(request),
    createIdentifierSequence: (
      request: CreateIdentifierSequenceRequest,
    ): Observable<CreateIdentifierSequenceResponse> =>
      this.loadBalance().createIdentifierSequence(request),
    deleteIdentifierSequence: (
      request: DeleteRequest,
    ): Observable<GetIdentifierSequenceResponse> =>
      this.loadBalance().deleteIdentifierSequence(request),
  };
  readonly address: Pick<
    ReferencesClient,
    | 'queryAddress'
    | 'createAddress'
    | 'deleteAddress'
    | 'getAddress'
    | 'updateAddress'
  > = {
    queryAddress: (
      request: QueryAddressRequest,
    ): Observable<QueryAddressResponse> =>
      this.loadBalance().queryAddress(request),
    createAddress: (
      request: CreateAddressRequest,
    ): Observable<GetAddressResponse> =>
      this.loadBalance().createAddress(request),
    deleteAddress: (request: DeleteRequest): Observable<GetAddressResponse> =>
      this.loadBalance().deleteAddress(request),
    getAddress: (request: GetRequest): Observable<GetAddressResponse> =>
      this.loadBalance().getAddress(request),
    updateAddress: (
      request: UpdateAddressRequest,
    ): Observable<GetAddressResponse> =>
      this.loadBalance().updateAddress(request),
  };
  readonly addressHierarchy: Pick<
    ReferencesClient,
    'queryAddressHierarchy' | 'deleteAddressHierarchy'
  > = {
    queryAddressHierarchy: (
      request: QueryAddressHierarchyRequest,
    ): Observable<QueryAddressHierarchyResponse> =>
      this.loadBalance().queryAddressHierarchy(request),
    deleteAddressHierarchy: (
      request: DeleteRequest,
    ): Observable<GetAddressHierarchyResponse> =>
      this.loadBalance().deleteAddressHierarchy(request),
  };

  private loadBalance() {
    // Get service internally uses random strategy to load balance cached clients
    // Should randomize/load balance on every call
    const service = this.client.getService<ReferencesClient>();
    if (!service) throw new Error('No service instance');
    return service;
  }
  onModuleInit() {
    return this.client.onModuleInit();
  }
  onModuleDestroy() {
    return this.client.onModuleDestroy();
  }
}
