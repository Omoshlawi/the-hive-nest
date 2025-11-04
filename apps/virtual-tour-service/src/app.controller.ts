import {
  CreateTourRequest,
  DeleteRequest,
  GetRequest,
  GetTourResponse,
  QueryTourRequest,
  QueryTourResponse,
  ITourController as ITourController,
  UpdateTourRequest,
  VIRTUAL_TOURS_SERVICE_NAME,
} from '@hive/virtual-tour';
import { Controller, NotFoundException } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { TourService } from './app.service';

@Controller()
export class ITourController implements ITourController {
  constructor(private readonly appService: TourService) {}
  @GrpcMethod(VIRTUAL_TOURS_SERVICE_NAME)
  queryTour(request: QueryTourRequest): Promise<QueryTourResponse> {
    return this.appService.getAll(
      request,
    ) as unknown as Promise<QueryTourResponse>;
  }
  @GrpcMethod(VIRTUAL_TOURS_SERVICE_NAME)
  async getTour(request: GetRequest): Promise<GetTourResponse> {
    const res = await this.appService.getById(request);
    if (!res.data)
      throw new RpcException(new NotFoundException('Tour not found'));
    return res as unknown as GetTourResponse;
  }
  @GrpcMethod(VIRTUAL_TOURS_SERVICE_NAME)
  createTour(request: CreateTourRequest): Promise<GetTourResponse> {
    return this.appService.create(
      request,
    ) as unknown as Promise<GetTourResponse>;
  }
  @GrpcMethod(VIRTUAL_TOURS_SERVICE_NAME)
  updateTour(request: UpdateTourRequest): Promise<GetTourResponse> {
    return this.appService.update(
      request,
    ) as unknown as Promise<GetTourResponse>;
  }
  @GrpcMethod(VIRTUAL_TOURS_SERVICE_NAME)
  deleteTour(request: DeleteRequest): Promise<GetTourResponse> {
    return this.appService.delete(
      request,
    ) as unknown as Promise<GetTourResponse>;
  }
}
