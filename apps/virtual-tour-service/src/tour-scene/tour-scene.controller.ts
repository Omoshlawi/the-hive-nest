import { Controller, NotFoundException } from '@nestjs/common';
import { TourSceneService } from './tour-scene.service';
import {
  SceneController,
  QuerySceneRequest,
  QuerySceneResponse,
  GetRequest,
  GetSceneResponse,
  VIRTUAL_TOURS_SERVICE_NAME,
  UpdateSceneRequest,
  CreateSceneRequest,
  DeleteRequest,
} from '@hive/virtual-tour';
import { GrpcMethod, RpcException } from '@nestjs/microservices';

@Controller('tour-scene')
export class TourSceneController implements SceneController {
  constructor(private readonly tourSceneService: TourSceneService) {}
  @GrpcMethod(VIRTUAL_TOURS_SERVICE_NAME)
  queryScene(request: QuerySceneRequest): Promise<QuerySceneResponse> {
    return this.tourSceneService.getAll(
      request,
    ) as unknown as Promise<QuerySceneResponse>;
  }
  @GrpcMethod(VIRTUAL_TOURS_SERVICE_NAME)
  async getScene(request: GetRequest): Promise<GetSceneResponse> {
    const res = await this.tourSceneService.getById(request);
    if (!res.data)
      throw new RpcException(new NotFoundException('Scene not found'));
    return res as unknown as GetSceneResponse;
  }
  @GrpcMethod(VIRTUAL_TOURS_SERVICE_NAME)
  createScene(request: CreateSceneRequest): Promise<GetSceneResponse> {
    return this.tourSceneService.create(
      request,
    ) as unknown as Promise<GetSceneResponse>;
  }
  @GrpcMethod(VIRTUAL_TOURS_SERVICE_NAME)
  updateScene(request: UpdateSceneRequest): Promise<GetSceneResponse> {
    return this.tourSceneService.update(
      request,
    ) as unknown as Promise<GetSceneResponse>;
  }
  @GrpcMethod(VIRTUAL_TOURS_SERVICE_NAME)
  deleteScene(request: DeleteRequest): Promise<GetSceneResponse> {
    return this.tourSceneService.delete(
      request,
    ) as unknown as Promise<GetSceneResponse>;
  }
}
