import {
  CreateAddressRequest,
  DeleteRequest,
  GetAddressResponse,
  GetRequest,
  IAddressController,
  QueryAddressRequest,
  QueryAddressResponse,
  REFERENCES_SERVICE_NAME,
  UpdateAddressRequest,
} from '@hive/reference';
import { Controller, NotFoundException } from '@nestjs/common';
import { AddressService } from './address.service';
import { GrpcMethod, RpcException } from '@nestjs/microservices';

@Controller('address')
export class AddressController implements IAddressController {
  constructor(private readonly addressService: AddressService) {}
  @GrpcMethod(REFERENCES_SERVICE_NAME)
  queryAddress(request: QueryAddressRequest): Promise<QueryAddressResponse> {
    return this.addressService.getAll(
      request,
    ) as unknown as Promise<QueryAddressResponse>;
  }
  @GrpcMethod(REFERENCES_SERVICE_NAME)
  async getAddress(request: GetRequest): Promise<GetAddressResponse> {
    const res = await this.addressService.getById(request);
    if (!res.data)
      throw new RpcException(new NotFoundException('Amenity not found'));
    return res as unknown as GetAddressResponse;
  }
  @GrpcMethod(REFERENCES_SERVICE_NAME)
  createAddress(request: CreateAddressRequest): Promise<GetAddressResponse> {
    return this.addressService.create(
      request,
    ) as unknown as Promise<GetAddressResponse>;
  }
  @GrpcMethod(REFERENCES_SERVICE_NAME)
  updateAddress(request: UpdateAddressRequest): Promise<GetAddressResponse> {
    return this.addressService.update(
      request,
    ) as unknown as Promise<GetAddressResponse>;
  }
  @GrpcMethod(REFERENCES_SERVICE_NAME)
  deleteAddress(request: DeleteRequest): Promise<GetAddressResponse> {
    return this.addressService.delete(
      request,
    ) as unknown as Promise<GetAddressResponse>;
  }
}
