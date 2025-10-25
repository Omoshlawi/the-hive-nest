import {
  ApiErrorsResponse,
  CustomRepresentationQueryDto,
  DeleteQueryDto,
} from '@hive/common';
import {
  CreateAddressDto,
  GetAddressResponseDto,
  HiveReferencesServiceClient,
  QueryAddressDto,
  QueryAddressResponseDto,
  UpdateAddressDto,
} from '@hive/reference';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import {
  ApiDetailTransformInterceptor,
  ApiListTransformInterceptor,
} from '../app.interceptors';
import { Session } from '@thallesp/nestjs-better-auth';
import { UserSession } from '../auth/auth.types';
import { ZodValidationException } from 'nestjs-zod';

@Controller('addresses')
export class AddressController {
  constructor(private referenceService: HiveReferencesServiceClient) {}

  @Get('/')
  @UseInterceptors(ApiListTransformInterceptor)
  @ApiOperation({ summary: 'Query Address' })
  @ApiOkResponse({ type: QueryAddressResponseDto })
  @ApiErrorsResponse()
  queryAddress(
    @Query() query: QueryAddressDto,
    @Session() { session, user }: UserSession,
  ) {
    return this.referenceService.address.queryAddress({
      queryBuilder: {
        limit: query.limit,
        orderBy: query.orderBy,
        page: query.page,
        v: query.v,
      },
      includeVoided: query.includeVoided,
      search: query.search,
      country: query.country,
      postalCode: query.postalCode,
      type: query.type,
      userId: query.userId,
      organizationId: query.organizationId,
      level1: query.level1,
      level2: query.level2,
      level3: query.level3,
      level4: query.level4,
      level5: query.level5,
      startDateFrom: query.startDateFrom,
      startDateTo: query.startDateTo,
      endDateFrom: query.endDateFrom,
      endDateTo: query.endDateTo,
      createdAtFrom: query.createdAtFrom,
      createdAtTo: query.createdAtTo,
      context: {
        organizationId: session.activeOrganizationId,
        userId: user.id,
      },
      location: query.location,
    });
  }

  @Post('/')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Create Address' })
  @ApiCreatedResponse({ type: GetAddressResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  createAddress(
    @Body() createAddressDto: CreateAddressDto,
    @Query() query: CustomRepresentationQueryDto,
    @Session() { session, user }: UserSession,
  ) {
    if (
      createAddressDto.isOrganizationAddress &&
      !session.activeOrganizationId
    ) {
      throw new ZodValidationException({
        issues: [
          {
            code: 'custom',
            message:
              'Cannot create organization address without an active organization',
            path: ['isOrganizationAddress'],
          },
        ],
      });
    }
    return this.referenceService.address.createAddress({
      queryBuilder: {
        v: query.v,
      },
      ...createAddressDto,
      localeFormat: createAddressDto.localeFormat as Record<string, string>,
      context: {
        organizationId: session.activeOrganizationId,
        userId: user.id,
      },
    });
  }

  @Get('/:id')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Get Address' })
  @ApiOkResponse({ type: GetAddressResponseDto })
  @ApiErrorsResponse()
  getAddress(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: CustomRepresentationQueryDto,
    @Session() { session, user }: UserSession,
  ) {
    return this.referenceService.address.getAddress({
      id,
      queryBuilder: query,
      context: {
        organizationId: session.activeOrganizationId,
        userId: user.id,
      },
    });
  }

  @Patch('/:id')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Update Address' })
  @ApiOkResponse({ type: GetAddressResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  updateAddress(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAddressDto: UpdateAddressDto,
    @Query() query: CustomRepresentationQueryDto,
    @Session() { session, user }: UserSession,
  ) {
    return this.referenceService.address.updateAddress({
      id,
      queryBuilder: { v: query?.v },
      ...updateAddressDto,
      localeFormat: updateAddressDto.localeFormat as Record<string, string>,
      context: {
        organizationId: session.activeOrganizationId,
        userId: user.id,
      },
    });
  }

  @Delete('/:id')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Delete Address' })
  @ApiOkResponse({ type: GetAddressResponseDto })
  @ApiErrorsResponse()
  deleteAddress(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DeleteQueryDto,
    @Session() { session, user }: UserSession,
  ) {
    return this.referenceService.address.deleteAddress({
      id,
      queryBuilder: { v: query.v },
      purge: query.purge,
      context: {
        organizationId: session.activeOrganizationId,
        userId: user.id,
      },
    });
  }
}
