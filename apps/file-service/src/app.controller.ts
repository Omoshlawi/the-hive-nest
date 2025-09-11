import {
  CreateFileRequest,
  DeleteRequest,
  FILES_SERVICE_NAME,
  GetFileResponse,
  GetRequest,
  QueryFileRequest,
  QueryFileResponse
} from '@hive/files';
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { AppService } from './app.service';

@Controller()
export class AppController {
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
}
