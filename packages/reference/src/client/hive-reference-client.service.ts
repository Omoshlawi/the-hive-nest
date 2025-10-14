/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { HiveService, HiveServiceClient } from '@hive/registry';
import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Observable } from 'rxjs';

import { DeleteRequest } from '../types/common.message';
import { HIVE_REFERENCE_SERVICE_NAME, REFERENCE_PACKAGE } from '../constants';
import {
  CreateIdentifierSequenceRequest,
  GetIdentifierSequenceResponse,
  QueryIdentifierSequenceRequest,
  QueryIdentifierSequenceResponse,
  REFERENCES_SERVICE_NAME,
  ReferencesClient,
} from '../types';

@HiveService({
  package: REFERENCE_PACKAGE.V1.NAME,
  protoPath: REFERENCE_PACKAGE.V1.PROTO_PATH,
  version: '0.0.1',
  serviceName: REFERENCES_SERVICE_NAME,
  name: HIVE_REFERENCE_SERVICE_NAME,
})
export class HiveFileServiceClient implements OnModuleInit, OnModuleDestroy {
  constructor(private client: HiveServiceClient) {}

  readonly identifierSequence: ReferencesClient = {
    queryIdentifierSequence: (
      request: QueryIdentifierSequenceRequest,
    ): Observable<QueryIdentifierSequenceResponse> =>
      this.loadBalance().queryIdentifierSequence(request),
    createIdentifierSequence: (
      request: CreateIdentifierSequenceRequest,
    ): Observable<GetIdentifierSequenceResponse> =>
      this.loadBalance().createIdentifierSequence(request),
    deleteIdentifierSequence: (
      request: DeleteRequest,
    ): Observable<GetIdentifierSequenceResponse> =>
      this.loadBalance().deleteIdentifierSequence(request),
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
