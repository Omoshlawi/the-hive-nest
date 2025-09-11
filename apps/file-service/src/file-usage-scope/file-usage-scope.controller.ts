import {
  QueryFileUsageScopeRequest,
  QueryFileUsageScopeResponse,
  GetRequest,
  GetFileUsageScopeResponse,
  CreateFileUsageScopeRequest,
  UpdateFileUsageScopeRequest,
  DeleteRequest,
  FILES_SERVICE_NAME,
} from '@hive/files';
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { FileUsageScopeService } from './file-usage-scope.service';

@Controller('file-usage-scope')
export class FileUsageScopeController {
  constructor(private fileUsageScopeService: FileUsageScopeService) {}
  @GrpcMethod(FILES_SERVICE_NAME)
  queryFileUsageScope(
    request: QueryFileUsageScopeRequest,
  ): Observable<QueryFileUsageScopeResponse> {
    throw new Error('Method not implemented.');
  }
  @GrpcMethod(FILES_SERVICE_NAME)
  getFileUsageScope(
    request: GetRequest,
  ): Observable<GetFileUsageScopeResponse> {
    throw new Error('Method not implemented.');
  }
  @GrpcMethod(FILES_SERVICE_NAME)
  createFileUsageScope(
    request: CreateFileUsageScopeRequest,
  ): Observable<GetFileUsageScopeResponse> {
    throw new Error('Method not implemented.');
  }
  @GrpcMethod(FILES_SERVICE_NAME)
  updateFileUsageScope(
    request: UpdateFileUsageScopeRequest,
  ): Observable<GetFileUsageScopeResponse> {
    throw new Error('Method not implemented.');
  }
  @GrpcMethod(FILES_SERVICE_NAME)
  deleteFileUsageScope(
    request: DeleteRequest,
  ): Observable<GetFileUsageScopeResponse> {
    throw new Error('Method not implemented.');
  }
}
