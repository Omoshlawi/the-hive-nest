import {
  CreateFileUsageRuleRequest,
  DeleteRequest,
  FILES_SERVICE_NAME,
  GetFileUsageRuleResponse,
  GetRequest,
  QueryFileUsageRuleRequest,
  QueryFileUsageRuleResponse,
  UpdateFileUsageRuleRequest,
} from '@hive/files';
import { Controller } from '@nestjs/common';
import { Observable } from 'rxjs';
import { FileUsageRuleService } from './file-usage-rule.service';
import { GrpcMethod } from '@nestjs/microservices';

@Controller('file-usage-rule')
export class FileUsageRuleController {
  constructor(private fileUsageRuleService: FileUsageRuleService) {}
  @GrpcMethod(FILES_SERVICE_NAME)
  queryFileUsageRule(
    request: QueryFileUsageRuleRequest,
  ): Observable<QueryFileUsageRuleResponse> {
    throw new Error('Method not implemented.');
  }
  @GrpcMethod(FILES_SERVICE_NAME)
  getFileUsageRule(request: GetRequest): Observable<GetFileUsageRuleResponse> {
    throw new Error('Method not implemented.');
  }
  @GrpcMethod(FILES_SERVICE_NAME)
  createFileUsageRule(
    request: CreateFileUsageRuleRequest,
  ): Observable<GetFileUsageRuleResponse> {
    throw new Error('Method not implemented.');
  }
  @GrpcMethod(FILES_SERVICE_NAME)
  updateFileUsageRule(
    request: UpdateFileUsageRuleRequest,
  ): Observable<GetFileUsageRuleResponse> {
    throw new Error('Method not implemented.');
  }
  @GrpcMethod(FILES_SERVICE_NAME)
  deleteFileUsageRule(
    request: DeleteRequest,
  ): Observable<GetFileUsageRuleResponse> {
    throw new Error('Method not implemented.');
  }
}
