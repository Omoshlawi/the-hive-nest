import {
  CreateRelationshipTypeRequest,
  DeleteRelationshipTypeRequest,
  GetRelationshipTypeRequest,
  GetRelationshipTypeResponse,
  PROPERTIES_SERVICE_NAME,
  QueryRelationshipTypeRequest,
  QueryRelationshipTypeResponse,
  UpdateRelationshipTypeRequest,
} from '@hive/property';
import { Controller, NotFoundException } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { RelationshipTypesService } from './relationship-types.service';

@Controller('relationship-types')
export class RelationshipTypesController {
  constructor(
    private readonly relationshipTypeService: RelationshipTypesService,
  ) {}

  @GrpcMethod(PROPERTIES_SERVICE_NAME, 'queryRelationshipType')
  queryRelationshipType(
    request: QueryRelationshipTypeRequest,
  ): Promise<QueryRelationshipTypeResponse> {
    return this.relationshipTypeService.getAll(
      request,
    ) as unknown as Promise<QueryRelationshipTypeResponse>;
  }
  @GrpcMethod(PROPERTIES_SERVICE_NAME, 'getRelationshipType')
  async getRelationshipType(
    request: GetRelationshipTypeRequest,
  ): Promise<GetRelationshipTypeResponse> {
    const res = await this.relationshipTypeService.getById(request);
    if (!res.data)
      throw new RpcException(new NotFoundException('Amenity not found'));
    return res as unknown as GetRelationshipTypeResponse;
  }
  @GrpcMethod(PROPERTIES_SERVICE_NAME, 'createRelationshipType')
  createRelationshipType(
    request: CreateRelationshipTypeRequest,
  ): Promise<GetRelationshipTypeResponse> {
    return this.relationshipTypeService.create(
      request,
    ) as unknown as Promise<GetRelationshipTypeResponse>;
  }
  @GrpcMethod(PROPERTIES_SERVICE_NAME, 'updateRelationshipType')
  updateRelationshipType(
    request: UpdateRelationshipTypeRequest,
  ): Promise<GetRelationshipTypeResponse> {
    return this.relationshipTypeService.update(
      request,
    ) as unknown as Promise<GetRelationshipTypeResponse>;
  }
  @GrpcMethod(PROPERTIES_SERVICE_NAME, 'deleteRelationshipType')
  deleteRelationshipType(
    request: DeleteRelationshipTypeRequest,
  ): Promise<GetRelationshipTypeResponse> {
    return this.relationshipTypeService.delete(
      request,
    ) as unknown as Promise<GetRelationshipTypeResponse>;
  }
}
