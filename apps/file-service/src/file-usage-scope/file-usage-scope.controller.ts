import {
  CreateFileUsageScopeRequest,
  DeleteRequest,
  FILES_SERVICE_NAME,
  FileUsageAuthzService,
  GetFileUsageScopeResponse,
  GetRequest,
  QueryFileUsageScopeRequest,
  QueryFileUsageScopeResponse,
  UpdateFileUsageScopeRequest,
} from '@hive/files';
import {
  BadRequestException,
  Controller,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { FileUsageScopeService } from './file-usage-scope.service';

@Controller('file-usage-scope')
export class FileUsageScopeController {
  constructor(
    private fileUsageScopeService: FileUsageScopeService,
    private authz: FileUsageAuthzService,
  ) {}

  private async requirePermisions(userId?: string) {
    if (!userId) {
      throw new RpcException(
        new BadRequestException('User ID is required in the request context.'),
      );
    }
    const canCreate = await this.authz.canCreateFileUsageScope(userId);
    if (!canCreate) {
      throw new RpcException(
        new ForbiddenException(
          'You do not have permission to create a file usage scope.',
        ),
      );
    }
  }
  @GrpcMethod(FILES_SERVICE_NAME)
  async queryFileUsageScope(
    request: QueryFileUsageScopeRequest,
  ): Promise<QueryFileUsageScopeResponse> {
    return this.fileUsageScopeService.getAll(
      request,
    ) as unknown as QueryFileUsageScopeResponse;
  }
  @GrpcMethod(FILES_SERVICE_NAME)
  async getFileUsageScope(
    request: GetRequest,
  ): Promise<GetFileUsageScopeResponse> {
    const res = await this.fileUsageScopeService.getById(request);
    if (!res.data)
      throw new RpcException(new NotFoundException('Amenity not found'));
    return res as unknown as GetFileUsageScopeResponse;
  }

  @GrpcMethod(FILES_SERVICE_NAME)
  async createFileUsageScope(
    request: CreateFileUsageScopeRequest,
  ): Promise<GetFileUsageScopeResponse> {
    await this.requirePermisions(request.context?.userId);
    const scope = (await this.fileUsageScopeService.create(
      request,
    )) as unknown as GetFileUsageScopeResponse;
    return scope;
  }
  @GrpcMethod(FILES_SERVICE_NAME)
  async updateFileUsageScope(
    request: UpdateFileUsageScopeRequest,
  ): Promise<GetFileUsageScopeResponse> {
    await this.requirePermisions(request.context?.userId);
    const res = await this.fileUsageScopeService.update(request);
    return res as unknown as GetFileUsageScopeResponse;
  }
  @GrpcMethod(FILES_SERVICE_NAME)
  async deleteFileUsageScope(
    request: DeleteRequest,
  ): Promise<GetFileUsageScopeResponse> {
    await this.requirePermisions(request.context?.userId);
    return (await this.fileUsageScopeService.delete(
      request,
    )) as unknown as GetFileUsageScopeResponse;
  }
}
