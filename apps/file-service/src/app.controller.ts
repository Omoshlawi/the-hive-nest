import {
  CreateFileRequest,
  DeleteRequest,
  FILES_SERVICE_NAME,
  GetFileResponse,
  GetRequest,
  QueryFileRequest,
  QueryFileResponse,
} from '@hive/files';
import { Controller, NotFoundException } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  @GrpcMethod(FILES_SERVICE_NAME)
  queryFile(request: QueryFileRequest): Promise<QueryFileResponse> {
    return this.appService.getAll(
      request,
    ) as unknown as Promise<QueryFileResponse>;
  }
  @GrpcMethod(FILES_SERVICE_NAME)
  async getFile(request: GetRequest): Promise<GetFileResponse> {
    const res = await this.appService.getById(request);
    if (!res.data)
      throw new RpcException(new NotFoundException('Amenity not found'));
    return res as unknown as GetFileResponse;
  }
  @GrpcMethod(FILES_SERVICE_NAME)
  createFile(request: CreateFileRequest): Promise<GetFileResponse> {
    return this.appService.create(
      request,
    ) as unknown as Promise<GetFileResponse>;
  }

  @GrpcMethod(FILES_SERVICE_NAME)
  deleteFile(request: DeleteRequest): Promise<GetFileResponse> {
    return this.appService.delete(
      request,
    ) as unknown as Promise<GetFileResponse>;
  }
}
