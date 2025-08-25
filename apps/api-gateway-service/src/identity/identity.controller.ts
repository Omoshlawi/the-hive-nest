import { Controller, NotFoundException } from '@nestjs/common';
import { IdentityService } from './identity.service';
import {
  GetInvitationRequest,
  GetMemberRequest,
  GetOrganizationRequest,
  GetUserRequest,
  IDENTITY_SERVICE_NAME,
  IdentityServiceController,
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

@Controller('identity')
export class IdentityController implements IdentityServiceController {
  constructor(
    private readonly identityService: IdentityService,
    private readonly prisma: PrismaService,
  ) {}

  @GrpcMethod(IDENTITY_SERVICE_NAME)
  async getUser({ id, rep }: GetUserRequest): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },

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
