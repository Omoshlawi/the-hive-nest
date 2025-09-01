import {
  CreateAttributeTypeRequest,
  DeleteAttributeTypeRequest,
  GetAttributeTypeRequest,
  GetAttributeTypeResponse,
  PROPERTY_SERVICE_NAME,
  QueryAttributeTypeRequest,
  QueryAttributeTypeResponse,
  UpdateAttributeTypeRequest,
} from '@hive/property';
import { Controller, NotFoundException } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { AttributeTypesService } from './attribute-types.service';

@Controller('attribute-types')
export class AttributeTypesController {
  constructor(private readonly attributeTypeService: AttributeTypesService) {}
  @GrpcMethod(PROPERTY_SERVICE_NAME, 'queryAttributeTypes')
  queryAttributeTypes(
    request: QueryAttributeTypeRequest,
  ): Promise<QueryAttributeTypeResponse> {
    return this.attributeTypeService.getAll(
      request,
    ) as unknown as Promise<QueryAttributeTypeResponse>;
  }
  @GrpcMethod(PROPERTY_SERVICE_NAME, 'getAttributeType')
  async getAttributeType(
    request: GetAttributeTypeRequest,
  ): Promise<GetAttributeTypeResponse> {
    const res = await this.attributeTypeService.getById(request);
    if (!res.data)
      throw new RpcException(new NotFoundException('Attributetype not found'));
    return res as unknown as GetAttributeTypeResponse;
  }
  @GrpcMethod(PROPERTY_SERVICE_NAME, 'createAttributeType')
  createAttributeType(
    request: CreateAttributeTypeRequest,
  ): Promise<GetAttributeTypeResponse> {
    return this.attributeTypeService.create(
      request,
    ) as unknown as Promise<GetAttributeTypeResponse>;
  }
  @GrpcMethod(PROPERTY_SERVICE_NAME, 'updateAttributeType')
  updateAttributeType(
    request: UpdateAttributeTypeRequest,
  ): Promise<GetAttributeTypeResponse> {
    return this.attributeTypeService.update(
      request,
    ) as unknown as Promise<GetAttributeTypeResponse>;
  }
  @GrpcMethod(PROPERTY_SERVICE_NAME, 'deleteAttributeType')
  deleteAttributeType(
    request: DeleteAttributeTypeRequest,
  ): Promise<GetAttributeTypeResponse> {
    return this.attributeTypeService.delete(
      request,
    ) as unknown as Promise<GetAttributeTypeResponse>;
  }
}
