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
import { Controller, NotFoundException } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { FileUsageRuleService } from './file-usage-rule.service';

@Controller('file-usage-rule')
export class FileUsageRuleController {
  constructor(private fileUsageRuleService: FileUsageRuleService) {}
  @GrpcMethod(FILES_SERVICE_NAME)
  queryFileUsageRule(
    request: QueryFileUsageRuleRequest,
  ): Promise<QueryFileUsageRuleResponse> {
    return this.fileUsageRuleService.getAll(
      request,
    ) as unknown as Promise<QueryFileUsageRuleResponse>;
  }
  @GrpcMethod(FILES_SERVICE_NAME)
  async getFileUsageRule(
    request: GetRequest,
  ): Promise<GetFileUsageRuleResponse> {
    const res = await this.fileUsageRuleService.getById(request);
    if (!res.data)
      throw new RpcException(
        new NotFoundException('Resource Usage rule not found'),
      );
    return res as unknown as GetFileUsageRuleResponse;
  }
  @GrpcMethod(FILES_SERVICE_NAME)
  createFileUsageRule(
    request: CreateFileUsageRuleRequest,
  ): Promise<GetFileUsageRuleResponse> {
    return this.fileUsageRuleService.create(
      request,
    ) as unknown as Promise<GetFileUsageRuleResponse>;
  }
  @GrpcMethod(FILES_SERVICE_NAME)
  updateFileUsageRule(
    request: UpdateFileUsageRuleRequest,
  ): Promise<GetFileUsageRuleResponse> {
    return this.fileUsageRuleService.update(
      request,
    ) as unknown as Promise<GetFileUsageRuleResponse>;
  }
  @GrpcMethod(FILES_SERVICE_NAME)
  deleteFileUsageRule(
    request: DeleteRequest,
  ): Promise<GetFileUsageRuleResponse> {
    return this.fileUsageRuleService.delete(
      request,
    ) as unknown as Promise<GetFileUsageRuleResponse>;
  }
}
