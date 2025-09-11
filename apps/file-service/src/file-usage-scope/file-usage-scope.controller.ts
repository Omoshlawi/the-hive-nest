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
import { Controller, NotFoundException } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { FileUsageScopeService } from './file-usage-scope.service';

@Controller('file-usage-scope')
export class FileUsageScopeController {
  constructor(private fileUsageScopeService: FileUsageScopeService) {}
  @GrpcMethod(FILES_SERVICE_NAME)
  queryFileUsageScope(
    request: QueryFileUsageScopeRequest,
  ): Promise<QueryFileUsageScopeResponse> {
    return this.fileUsageScopeService.getAll(
      request,
    ) as unknown as Promise<QueryFileUsageScopeResponse>;
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
  createFileUsageScope(
    request: CreateFileUsageScopeRequest,
  ): Promise<GetFileUsageScopeResponse> {
    return this.fileUsageScopeService.create(
      request,
    ) as unknown as Promise<GetFileUsageScopeResponse>;
  }
  @GrpcMethod(FILES_SERVICE_NAME)
  updateFileUsageScope(
    request: UpdateFileUsageScopeRequest,
  ): Promise<GetFileUsageScopeResponse> {
    return this.fileUsageScopeService.update(
      request,
    ) as unknown as Promise<GetFileUsageScopeResponse>;
  }
  @GrpcMethod(FILES_SERVICE_NAME)
  deleteFileUsageScope(
    request: DeleteRequest,
  ): Promise<GetFileUsageScopeResponse> {
    return this.fileUsageScopeService.delete(
      request,
    ) as unknown as Promise<GetFileUsageScopeResponse>;
  }
}
