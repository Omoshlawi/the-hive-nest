import {
  DeleteRequest,
  GetAddressHierarchyResponse,
  QueryAddressHierarchyRequest,
  QueryAddressHierarchyResponse,
  REFERENCES_SERVICE_NAME,
  ReferencesController,
} from '@hive/reference';
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AddressHierarchyService } from './address-hierarchy.service';

@Controller('address-hierarchy')
export class AddressHierarchyController
  implements
    Pick<
      ReferencesController,
      'queryAddressHierarchy' | 'deleteAddressHierarchy'
    >
{
  constructor(
    private readonly addressHierarchyService: AddressHierarchyService,
  ) {}
  @GrpcMethod(REFERENCES_SERVICE_NAME)
  queryAddressHierarchy(
    request: QueryAddressHierarchyRequest,
  ): Promise<QueryAddressHierarchyResponse> {
    return this.addressHierarchyService.getAll(
      request,
    ) as Promise<QueryAddressHierarchyResponse>;
  }
  @GrpcMethod(REFERENCES_SERVICE_NAME)
  deleteAddressHierarchy(
    request: DeleteRequest,
  ): Promise<GetAddressHierarchyResponse> {
    return this.addressHierarchyService.delete(
      request,
    ) as Promise<GetAddressHierarchyResponse>;
  }
}
