import { Controller, NotFoundException } from '@nestjs/common';
import {
  GetInvitationRequest,
  GetMemberRequest,
  GetOrganizationRequest,
  GetUserRequest,
  IDENTITY_SERVICE_NAME,
  IdentityController as RIdentityController,
  Invitation,
  ListInvitationsRequest,
  ListInvitationsResponse,
  ListMembersRequest,
  ListMembersResponse,
  ListOrganizationsRequest,
  ListOrganizationsResponse,
  Member,
  Organization,
  User,
} from '@hive/identity';
import { Observable } from 'rxjs';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { auth } from '../lib/auth';
import { PrismaService } from '../prisma/prisma.service';
import { IdentityMappersUtils } from './indentity.utils';
import {
  CustomRepresentationService,
  PaginationService,
  SortService,
} from '@hive/common';

@Controller('identity')
export class IdentityController implements RIdentityController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly representation: CustomRepresentationService,
  ) {}

  @GrpcMethod(IDENTITY_SERVICE_NAME)
  async getUser({ id, rep }: GetUserRequest): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      ...this.representation.buildCustomRepresentationQuery(rep),
    });
    if (!user) {
      throw new RpcException(new NotFoundException('User not found'));
    }
    return IdentityMappersUtils.mapUser(user);
  }
  @GrpcMethod(IDENTITY_SERVICE_NAME)
  getOrganization(
    request: GetOrganizationRequest,
  ): Promise<Organization> | Observable<Organization> | Organization {
    throw new Error('Method not implemented.');
  }
  @GrpcMethod(IDENTITY_SERVICE_NAME)
  listOrganizations(
    request: ListOrganizationsRequest,
  ):
    | Promise<ListOrganizationsResponse>
    | Observable<ListOrganizationsResponse>
    | ListOrganizationsResponse {
    throw new Error('Method not implemented.');
  }
  @GrpcMethod(IDENTITY_SERVICE_NAME)
  listMembers(
    request: ListMembersRequest,
  ):
    | Promise<ListMembersResponse>
    | Observable<ListMembersResponse>
    | ListMembersResponse {
    throw new Error('Method not implemented.');
  }
  @GrpcMethod(IDENTITY_SERVICE_NAME)
  listInvitations(
    request: ListInvitationsRequest,
  ):
    | Promise<ListInvitationsResponse>
    | Observable<ListInvitationsResponse>
    | ListInvitationsResponse {
    throw new Error('Method not implemented.');
  }
  @GrpcMethod(IDENTITY_SERVICE_NAME)
  getMember(
    request: GetMemberRequest,
  ): Promise<Member> | Observable<Member> | Member {
    throw new Error('Method not implemented.');
  }
  @GrpcMethod(IDENTITY_SERVICE_NAME)
  getInvitation(
    request: GetInvitationRequest,
  ): Promise<Invitation> | Observable<Invitation> | Invitation {
    throw new Error('Method not implemented.');
  }
}
