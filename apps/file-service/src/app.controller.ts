import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import {
  FILES_SERVICE_NAME,
  FilesClient,
  FilesController,
  RegisterFileRequest,
  RegisterFileResponse,
} from '@hive/files';
import { Observable } from 'rxjs';
import { GrpcMethod } from '@nestjs/microservices';

@Controller()
export class AppController implements FilesController {
  constructor(private readonly appService: AppService) {}

  @GrpcMethod(FILES_SERVICE_NAME)
  registerFiles(
    request: RegisterFileRequest,
  ):
    | Promise<RegisterFileResponse>
    | Observable<RegisterFileResponse>
    | RegisterFileResponse {
    return this.appService.registerFiles(request);
  }
}
