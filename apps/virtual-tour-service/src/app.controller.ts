import { Controller, Get } from '@nestjs/common';
import {
  GrpcMethod,
  GrpcStreamMethod,
  RpcException,
} from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { AppService } from './app.service';
import {
  VIRTUAL_TOURS_SERVICE_NAME,
  FileUploadChunk,
  FileUploadResponse,
  GetSceneResponse,
} from '@hive/virtual-tour';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
}
