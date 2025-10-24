import { Controller } from '@nestjs/common';
import {
  CreateIdentifierSequenceRequest,
  CreateIdentifierSequenceResponse,
  DeleteRequest,
  GetIdentifierSequenceResponse,
  QueryIdentifierSequenceRequest,
  QueryIdentifierSequenceResponse,
  REFERENCES_SERVICE_NAME,
} from '@hive/reference';
import { IdentifierSequenceService } from './identifier-sequence.service';
import { GrpcMethod } from '@nestjs/microservices';
@Controller('identifier-sequence')
export class IdentifierSequenceController
  implements IdentifierSequenceController
{
  constructor(
    private readonly identifierSequenceservice: IdentifierSequenceService,
  ) {}
  @GrpcMethod(REFERENCES_SERVICE_NAME)
  queryIdentifierSequence(
    request: QueryIdentifierSequenceRequest,
  ): Promise<QueryIdentifierSequenceResponse> {
    return this.identifierSequenceservice.getAll(request);
  }
  @GrpcMethod(REFERENCES_SERVICE_NAME)
  createIdentifierSequence(
    request: CreateIdentifierSequenceRequest,
  ): Promise<CreateIdentifierSequenceResponse> {
    return this.identifierSequenceservice.create(request);
  }
  @GrpcMethod(REFERENCES_SERVICE_NAME)
  deleteIdentifierSequence(
    request: DeleteRequest,
  ): Promise<GetIdentifierSequenceResponse> {
    return this.identifierSequenceservice.delete(request);
  }
}
