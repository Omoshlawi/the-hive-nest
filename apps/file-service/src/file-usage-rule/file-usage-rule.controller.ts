import {
  CreateFileUsageRuleRequest,
  DeleteRequest,
  FILES_SERVICE_NAME,
  FileUsageAuthzService,
  GetFileUsageRuleResponse,
  GetRequest,
  QueryFileUsageRuleRequest,
  QueryFileUsageRuleResponse,
  UpdateFileUsageRuleRequest,
} from '@hive/files';
import {
  BadRequestException,
  Controller,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { FileUsageRuleService } from './file-usage-rule.service';

@Controller('file-usage-rule')
export class FileUsageRuleController {
  constructor(
    private fileUsageRuleService: FileUsageRuleService,
    private readonly authz: FileUsageAuthzService,
  ) {}

  private async requirePermisions(userId?: string) {
    if (!userId) {
      throw new RpcException(
        new BadRequestException('User ID is required in the request context.'),
      );
    }
    const canCreate = await this.authz.canCreateFileUsageRule(userId);
    if (!canCreate) {
      throw new RpcException(
        new ForbiddenException(
          'You do not have permission to create a file usage scope.',
        ),
      );
    }
  }
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
  async createFileUsageRule(
    request: CreateFileUsageRuleRequest,
  ): Promise<GetFileUsageRuleResponse> {
    await this.requirePermisions(request.context?.userId);
    return (await this.fileUsageRuleService.create(
      request,
    )) as unknown as GetFileUsageRuleResponse;
  }
  @GrpcMethod(FILES_SERVICE_NAME)
  async updateFileUsageRule(
    request: UpdateFileUsageRuleRequest,
  ): Promise<GetFileUsageRuleResponse> {
    await this.requirePermisions(request.context?.userId);

    return (await this.fileUsageRuleService.update(
      request,
    )) as unknown as GetFileUsageRuleResponse;
  }
  @GrpcMethod(FILES_SERVICE_NAME)
  async deleteFileUsageRule(
    request: DeleteRequest,
  ): Promise<GetFileUsageRuleResponse> {
    await this.requirePermisions(request.context?.userId);

    return (await this.fileUsageRuleService.delete(
      request,
    )) as unknown as GetFileUsageRuleResponse;
  }
}
