import {
  DeleteRequest,
  GetAddressHierarchyResponse,
  IAddressHierarchyController,
  QueryAddressHierarchyRequest,
  QueryAddressHierarchyResponse,
  REFERENCES_SERVICE_NAME,
} from '@hive/reference';
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AddressHierarchyService } from './address-hierarchy.service';

@Controller('address-hierarchy')
export class AddressHierarchyController implements IAddressHierarchyController {
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
