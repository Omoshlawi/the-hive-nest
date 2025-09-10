import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import {
  CreateFileRequest,
  CreateFileUsageRuleRequest,
  CreateFileUsageScopeRequest,
  DeleteRequest,
  FILES_SERVICE_NAME,
  FilesController,
  GetFileResponse,
  GetFileUsageRuleResponse,
  GetFileUsageScopeResponse,
  GetRequest,
  QueryFileRequest,
  QueryFileResponse,
  QueryFileUsageRuleRequest,
  QueryFileUsageRuleResponse,
  QueryFileUsageScopeRequest,
  QueryFileUsageScopeResponse,
  UpdateFileUsageRuleRequest,
  UpdateFileUsageScopeRequest,
} from '@hive/files';
import { Observable } from 'rxjs';
import { GrpcMethod } from '@nestjs/microservices';

@Controller()
export class AppController implements FilesController {
  constructor(private readonly appService: AppService) {}
  @GrpcMethod(FILES_SERVICE_NAME)
  queryFile(
    request: QueryFileRequest,
  ):
    | Promise<QueryFileResponse>
    | Observable<QueryFileResponse>
    | QueryFileResponse {
    throw new Error('Method not implemented.');
  }
  @GrpcMethod(FILES_SERVICE_NAME)
  getFile(
    request: GetRequest,
  ): Promise<GetFileResponse> | Observable<GetFileResponse> | GetFileResponse {
    throw new Error('Method not implemented.');
  }
  @GrpcMethod(FILES_SERVICE_NAME)
  createFile(
    request: CreateFileRequest,
  ): Promise<GetFileResponse> | Observable<GetFileResponse> | GetFileResponse {
    throw new Error('Method not implemented.');
  }
  @GrpcMethod(FILES_SERVICE_NAME)
  deleteFile(
    request: DeleteRequest,
  ): Promise<GetFileResponse> | Observable<GetFileResponse> | GetFileResponse {
    throw new Error('Method not implemented.');
  }
  queryFileUsageScope(
    request: QueryFileUsageScopeRequest,
  ):
    | Promise<QueryFileUsageScopeResponse>
    | Observable<QueryFileUsageScopeResponse>
    | QueryFileUsageScopeResponse {
    throw new Error('Method not implemented.');
  }
  getFileUsageScope(
    request: GetRequest,
  ):
    | Promise<GetFileUsageScopeResponse>
    | Observable<GetFileUsageScopeResponse>
    | GetFileUsageScopeResponse {
    throw new Error('Method not implemented.');
  }
  createFileUsageScope(
    request: CreateFileUsageScopeRequest,
  ):
    | Promise<GetFileUsageScopeResponse>
    | Observable<GetFileUsageScopeResponse>
    | GetFileUsageScopeResponse {
    throw new Error('Method not implemented.');
  }
  updateFileUsageScope(
    request: UpdateFileUsageScopeRequest,
  ):
    | Promise<GetFileUsageScopeResponse>
    | Observable<GetFileUsageScopeResponse>
    | GetFileUsageScopeResponse {
    throw new Error('Method not implemented.');
  }
  deleteFileUsageScope(
    request: DeleteRequest,
  ):
    | Promise<GetFileUsageScopeResponse>
    | Observable<GetFileUsageScopeResponse>
    | GetFileUsageScopeResponse {
    throw new Error('Method not implemented.');
  }
  queryFileUsageRule(
    request: QueryFileUsageRuleRequest,
  ):
    | Promise<QueryFileUsageRuleResponse>
    | Observable<QueryFileUsageRuleResponse>
    | QueryFileUsageRuleResponse {
    throw new Error('Method not implemented.');
  }
  getFileUsageRule(
    request: GetRequest,
  ):
    | Promise<GetFileUsageRuleResponse>
    | Observable<GetFileUsageRuleResponse>
    | GetFileUsageRuleResponse {
    throw new Error('Method not implemented.');
  }
  createFileUsageRule(
    request: CreateFileUsageRuleRequest,
  ):
    | Promise<GetFileUsageRuleResponse>
    | Observable<GetFileUsageRuleResponse>
    | GetFileUsageRuleResponse {
    throw new Error('Method not implemented.');
  }
  updateFileUsageRule(
    request: UpdateFileUsageRuleRequest,
  ):
    | Promise<GetFileUsageRuleResponse>
    | Observable<GetFileUsageRuleResponse>
    | GetFileUsageRuleResponse {
    throw new Error('Method not implemented.');
  }
  deleteFileUsageRule(
    request: DeleteRequest,
  ):
    | Promise<GetFileUsageRuleResponse>
    | Observable<GetFileUsageRuleResponse>
    | GetFileUsageRuleResponse {
    throw new Error('Method not implemented.');
  }
}
