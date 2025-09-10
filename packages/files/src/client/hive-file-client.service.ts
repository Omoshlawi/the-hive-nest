import { HiveService, HiveServiceClient } from '@hive/registry';
import {
  FilesClient,
  RegisterFileRequest,
  RegisterFileResponse,
  FILES_SERVICE_NAME,
} from '../types';
import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Observable } from 'rxjs';
import { FILE_PACKAGE, HIVE_FILE_SERVICE_NAME } from '../constants';

@HiveService({
  package: FILE_PACKAGE.V1.NAME,
  protoPath: FILE_PACKAGE.V1.PROTO_PATH,
  version: '0.0.1',
  serviceName: FILES_SERVICE_NAME,
  name: HIVE_FILE_SERVICE_NAME,
})
export class HiveFileServiceClient
  implements OnModuleInit, OnModuleDestroy, FilesClient
{
  constructor(private client: HiveServiceClient) {}
  registerFiles(
    request: RegisterFileRequest,
  ): Observable<RegisterFileResponse> {
    const files = this.loadBalance();
    return files.registerFiles(request);
  }
  private loadBalance() {
    const files = this.client.getService<FilesClient>();
    if (!files) throw new Error('No service instance');
    return files;
  }
  onModuleInit() {
    return this.client.onModuleInit();
  }
  onModuleDestroy() {
    return this.client.onModuleDestroy();
  }
}
