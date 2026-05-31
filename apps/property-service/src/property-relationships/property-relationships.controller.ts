import {
  CreateRelationshipRequest,
  DeleteRelationshipRequest,
  GetRelationshipRequest,
  GetRelationshipResponse,
  IRelationshipsController,
  PROPERTIES_SERVICE_NAME,
  QueryRelationshipRequest,
  QueryRelationshipResponse,
  UpdateRelationshipRequest,
} from '@hive/property';
import { Controller, NotFoundException } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { PropertyRelationshipsService } from './property-relationships.service';

@Controller('property-relationships')
export class PropertyRelationshipsController
  implements IRelationshipsController
{
  constructor(
    private readonly propertyRelationshipsService: PropertyRelationshipsService,
  ) {}

  @GrpcMethod(PROPERTIES_SERVICE_NAME)
  queryRelationship(
    request: QueryRelationshipRequest,
  ): Promise<QueryRelationshipResponse> {
    return this.propertyRelationshipsService.getAll(
      request,
    ) as unknown as Promise<QueryRelationshipResponse>;
  }

  @GrpcMethod(PROPERTIES_SERVICE_NAME)
  async getRelationship(
    request: GetRelationshipRequest,
  ): Promise<GetRelationshipResponse> {
    const res = await this.propertyRelationshipsService.getById(request);
    if (!res.data)
      throw new RpcException(new NotFoundException('Relationship not found'));
    return res as unknown as GetRelationshipResponse;
  }

  @GrpcMethod(PROPERTIES_SERVICE_NAME)
  createRelationship(
    request: CreateRelationshipRequest,
  ): Promise<GetRelationshipResponse> {
    return this.propertyRelationshipsService.create(
      request,
    ) as unknown as Promise<GetRelationshipResponse>;
  }

  @GrpcMethod(PROPERTIES_SERVICE_NAME)
  updateRelationship(
    request: UpdateRelationshipRequest,
  ): Promise<GetRelationshipResponse> {
    return this.propertyRelationshipsService.update(
      request,
    ) as unknown as Promise<GetRelationshipResponse>;
  }

  @GrpcMethod(PROPERTIES_SERVICE_NAME)
  deleteRelationship(
    request: DeleteRelationshipRequest,
  ): Promise<GetRelationshipResponse> {
    return this.propertyRelationshipsService.delete(
      request,
    ) as unknown as Promise<GetRelationshipResponse>;
  }
}
