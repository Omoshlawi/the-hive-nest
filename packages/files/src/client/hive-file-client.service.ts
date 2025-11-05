/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { HiveService, HiveServiceClient } from '@hive/registry';
import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Observable } from 'rxjs';
import { FILE_PACKAGE, HIVE_FILE_SERVICE_NAME } from '../constants';
import {
  CreateFileRequest,
  CreateFileUsageRuleRequest,
  CreateFileUsageScopeRequest,
  FILES_SERVICE_NAME,
  FilesClient,
  GenerateUploadSignedUrlRequest,
  GenerateUploadSignedUrlResponse,
  GetBlobResponse,
  GetByHashRequest,
  GetFileResponse,
  GetFileUsageRuleResponse,
  GetFileUsageScopeResponse,
  IFilesController,
  IFileUsageRuleController,
  IFileUsageScopeController,
  QueryFileRequest,
  QueryFileResponse,
  QueryFileUsageRuleRequest,
  QueryFileUsageRuleResponse,
  QueryFileUsageScopeRequest,
  QueryFileUsageScopeResponse,
  UpdateFileUsageRuleRequest,
  UpdateFileUsageScopeRequest,
} from '../types';
import { DeleteRequest, GetRequest } from '../types/common.message';

@HiveService({
  package: FILE_PACKAGE.V1.NAME,
  protoPath: FILE_PACKAGE.V1.PROTO_PATH,
  version: '0.0.1',
  serviceName: FILES_SERVICE_NAME,
  name: HIVE_FILE_SERVICE_NAME,
})
export class HiveFileServiceClient implements OnModuleInit, OnModuleDestroy {
  constructor(private client: HiveServiceClient) {}

  readonly fileUsageScope: IFileUsageScopeController = {
    queryFileUsageScope: (
      request: QueryFileUsageScopeRequest,
    ): Observable<QueryFileUsageScopeResponse> =>
      this.loadBalance().queryFileUsageScope(request),

    getFileUsageScope: (
      request: GetRequest,
    ): Observable<GetFileUsageScopeResponse> =>
      this.loadBalance().getFileUsageScope(request),

    createFileUsageScope: (
      request: CreateFileUsageScopeRequest,
    ): Observable<GetFileUsageScopeResponse> =>
      this.loadBalance().createFileUsageScope(request),

    updateFileUsageScope: (
      request: UpdateFileUsageScopeRequest,
    ): Observable<GetFileUsageScopeResponse> =>
      this.loadBalance().updateFileUsageScope(request),

    deleteFileUsageScope: (
      request: DeleteRequest,
    ): Observable<GetFileUsageScopeResponse> =>
      this.loadBalance().deleteFileUsageScope(request),
  };

  readonly fileUsageRule: IFileUsageRuleController = {
    queryFileUsageRule: (
      request: QueryFileUsageRuleRequest,
    ): Observable<QueryFileUsageRuleResponse> =>
      this.loadBalance().queryFileUsageRule(request),

    getFileUsageRule: (
      request: GetRequest,
    ): Observable<GetFileUsageRuleResponse> =>
      this.loadBalance().getFileUsageRule(request),

    createFileUsageRule: (
      request: CreateFileUsageRuleRequest,
    ): Observable<GetFileUsageRuleResponse> =>
      this.loadBalance().createFileUsageRule(request),

    updateFileUsageRule: (
      request: UpdateFileUsageRuleRequest,
    ): Observable<GetFileUsageRuleResponse> =>
      this.loadBalance().updateFileUsageRule(request),

    deleteFileUsageRule: (
      request: DeleteRequest,
    ): Observable<GetFileUsageRuleResponse> =>
      this.loadBalance().deleteFileUsageRule(request),
  };

  readonly file: IFilesController = {
    queryFile: (request: QueryFileRequest): Observable<QueryFileResponse> =>
      this.loadBalance().queryFile(request),
    getFile: (request: GetRequest): Observable<GetFileResponse> =>
      this.loadBalance().getFile(request),
    getBlobByHash: (request: GetByHashRequest): Observable<GetBlobResponse> =>
      this.loadBalance().getBlobByHash(request),
    createFile: (request: CreateFileRequest): Observable<GetFileResponse> =>
      this.loadBalance().createFile(request),
    deleteFile: (request: DeleteRequest): Observable<GetFileResponse> =>
      this.loadBalance().deleteFile(request),
    generateUploadSignedUrl: (
      request: GenerateUploadSignedUrlRequest,
    ): Observable<GenerateUploadSignedUrlResponse> =>
      this.loadBalance().generateUploadSignedUrl(request),
  };

  private loadBalance() {
    // Get service internally uses random strategy to load balance cached clients
    // Should randomize/load balance on every call
    const service = this.client.getService<FilesClient>();
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
