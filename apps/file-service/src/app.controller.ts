import {
  CreateFileRequest,
  DeleteRequest,
  FileAuthZService,
  FILES_SERVICE_NAME,
  GetFileResponse,
  GetRequest,
  QueryFileRequest,
  QueryFileResponse,
} from '@hive/files';
import {
  BadRequestException,
  Controller,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly authz: FileAuthZService,
  ) {}
  @GrpcMethod(FILES_SERVICE_NAME)
  async queryFile(request: QueryFileRequest): Promise<QueryFileResponse> {
    if (!request.context?.userId) {
      throw new RpcException(
        new BadRequestException('User ID is required in context'),
      );
    }
    if (request.context.organizationId) {
      const hasAccess = await this.authz.canViewOrganizationFiles(
        request.context?.userId,
        request.context.organizationId,
      );
      if (!hasAccess)
        throw new RpcException(
          new ForbiddenException(
            'You do not have permission to view a file in this organization.',
          ),
        );
    }
    return (await this.appService.getAll(
      request,
    )) as unknown as Promise<QueryFileResponse>;
  }
  @GrpcMethod(FILES_SERVICE_NAME)
  async getFile(request: GetRequest): Promise<GetFileResponse> {
    const res = await this.appService.getById(request);
    if (!res.data)
      throw new RpcException(new NotFoundException('Amenity not found'));
    return res as unknown as GetFileResponse;
  }
  @GrpcMethod(FILES_SERVICE_NAME)
  async createFile(request: CreateFileRequest): Promise<GetFileResponse> {
    if (!request.context?.userId) {
      throw new RpcException(
        new BadRequestException('User ID is required in context'),
      );
    }
    if (
      request.context.organizationId &&
      !(await this.authz.canCreateFile(
        request.context.userId,
        request.context.organizationId,
      ))
    )
      throw new RpcException(
        new ForbiddenException(
          'You do not have permission to create a file in this organization.',
        ),
      );
    // TODO: eNHANCE VALIDATION to chech upload purpose scope scope and rules
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
