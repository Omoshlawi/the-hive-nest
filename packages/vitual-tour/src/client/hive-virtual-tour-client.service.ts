/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { HiveService, HiveServiceClient } from '@hive/registry';
import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Observable } from 'rxjs';

import { DeleteRequest, GetRequest } from '../types/common.message';

import {
  HIVE_VIRTUAL_TOUR_SERVICE_NAME,
  VIRTUAL_TOUR_PACKAGE,
} from '../constants';
import {
  CreateSceneRequest,
  CreateTourRequest,
  FileUploadChunk,
  FileUploadResponse,
  GetSceneResponse,
  GetTourResponse,
  QuerySceneRequest,
  QuerySceneResponse,
  QueryTourRequest,
  QueryTourResponse,
  UpdateSceneRequest,
  UpdateTourRequest,
  VIRTUAL_TOURS_SERVICE_NAME,
  VirtualToursClient,
} from '../types';

@HiveService({
  package: VIRTUAL_TOUR_PACKAGE.V1.NAME,
  protoPath: VIRTUAL_TOUR_PACKAGE.V1.PROTO_PATH,
  version: '0.0.1',
  serviceName: VIRTUAL_TOURS_SERVICE_NAME,
  name: HIVE_VIRTUAL_TOUR_SERVICE_NAME,
})
export class HiveVirtualToursServiceClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private client: HiveServiceClient) {}

  readonly tour: Pick<
    VirtualToursClient,
    'queryTour' | 'getTour' | 'createTour' | 'updateTour' | 'deleteTour'
  > = {
    queryTour: (request: QueryTourRequest): Observable<QueryTourResponse> =>
      this.loadBalance().queryTour(request),
    getTour: (request: GetRequest): Observable<GetTourResponse> =>
      this.loadBalance().getTour(request),
    createTour: (request: CreateTourRequest): Observable<GetTourResponse> =>
      this.loadBalance().createTour(request),
    updateTour: (request: UpdateTourRequest): Observable<GetTourResponse> =>
      this.loadBalance().updateTour(request),
    deleteTour: (request: DeleteRequest): Observable<GetTourResponse> =>
      this.loadBalance().deleteTour(request),
  };
  readonly address: Pick<
    VirtualToursClient,
    'queryScene' | 'getScene' | 'createScene' | 'updateScene' | 'deleteScene'
  > = {
    queryScene: (request: QuerySceneRequest): Observable<QuerySceneResponse> =>
      this.loadBalance().queryScene(request),
    getScene: (request: GetRequest): Observable<GetSceneResponse> =>
      this.loadBalance().getScene(request),
    createScene: (request: CreateSceneRequest): Observable<GetSceneResponse> =>
      this.loadBalance().createScene(request),
    updateScene: (request: UpdateSceneRequest): Observable<GetSceneResponse> =>
      this.loadBalance().updateScene(request),
    deleteScene: (request: DeleteRequest): Observable<GetSceneResponse> =>
      this.loadBalance().deleteScene(request),
  };

  /**
   * Stream file upload to virtual tour service
   * This method handles large files by streaming them in chunks
   */
  streamUploadSceneFile(
    dataStream: Observable<FileUploadChunk>,
  ): Observable<FileUploadResponse> {
    const service = this.loadBalance();
    if ('streamUploadSceneFile' in service) {
      return (service as any).streamUploadSceneFile(dataStream);
    }
    throw new Error('streamUploadSceneFile method not available on service');
  }

  private loadBalance() {
    // Get service internally uses random strategy to load balance cached clients
    // Should randomize/load balance on every call
    const service = this.client.getService<VirtualToursClient>();
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
