import {
  ApiErrorsResponse,
  CustomRepresentationQueryDto,
  DeleteQueryDto,
} from '@hive/common';
import {
  CreatePropertyDto,
  GetPropertyResponseDto,
  HivePropertyServiceClient,
  QueryPropertyDto,
  QueryPropertyResponseDto,
  UpdatePropertyDto,
} from '@hive/property';
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
import { RequireOrganizationPermission } from '../auth/auth.decorators';
import {
  ApiDetailTransformInterceptor,
  ApiListTransformInterceptor,
} from '../app.interceptors';
import { OptionalAuth, Session } from '@thallesp/nestjs-better-auth';
import { UserSession } from '../auth/auth.types';

@Controller('properties')
export class PropertiesController {
  constructor(private propertiesService: HivePropertyServiceClient) {}

  @Get('/')
  @OptionalAuth()
  @UseInterceptors(ApiListTransformInterceptor)
  @ApiOperation({ summary: 'Query Property' })
  @ApiOkResponse({ type: QueryPropertyResponseDto })
  @ApiErrorsResponse()
  queryProperty(
    @Query() query: QueryPropertyDto,
    @Session() userSession?: UserSession,
  ) {
    const { session } = userSession ?? {};
    return this.propertiesService.properties.queryProperties({
      queryBuilder: {
        limit: query.limit,
        orderBy: query.orderBy,
        page: query.page,
        v: query.v,
      },
      includeVoided: query.includeVoided,
      search: query.search,
      attributes: query.attributes,
      amenities: query.amenities,
      categories: query.categories ?? [],
      address: query.address,
      context: {
        organizationId:
          query.organization && session?.activeOrganizationId
            ? session.activeOrganizationId
            : undefined,
      },
      isVirtual: query.isVirtual,
      status: query.status,
    });
  }

  @Post('/')
  @RequireOrganizationPermission({ property: ['create'] })
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Create Property' })
  @ApiCreatedResponse({ type: GetPropertyResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  createProperty(
    @Body() createPropertyDto: CreatePropertyDto,
    @Query() query: CustomRepresentationQueryDto,
    @Session() { session, user }: UserSession,
  ) {
    return this.propertiesService.properties.createProperty({
      queryBuilder: {
        v: query.v,
      },
      name: createPropertyDto.name,
      addressId: createPropertyDto.addressId,
      isVirtual: false,
      attributes: createPropertyDto.attributes ?? [],
      amenityIds: createPropertyDto?.amenities ?? [],
      categoryIds: createPropertyDto?.categories ?? [],
      media: (createPropertyDto?.media ?? []).map((media) => ({
        ...media,
        metadata: JSON.stringify(media.metadata),
      })),
      context: {
        organizationId: session.activeOrganizationId,
        userId: user.id,
      },
      description: createPropertyDto.description,
      thumbnail: createPropertyDto.thumbnail,
    });
  }

  @Get('/:id')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Get Property' })
  @ApiOkResponse({ type: GetPropertyResponseDto })
  @ApiErrorsResponse()
  getProperty(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.propertiesService.properties.getProperty({
      id,
      queryBuilder: query,
    });
  }

  @Patch('/:id')
  @RequireOrganizationPermission({ property: ['update'] })
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Update Property' })
  @ApiOkResponse({ type: GetPropertyResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  updateProperty(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.propertiesService.properties.updateProperty({
      id,
      queryBuilder: { v: query?.v },
      addressId: updatePropertyDto.addressId,
      context: {
        organizationId: '',
        userId: '',
      },
      description: updatePropertyDto.description,
      isVirtual: updatePropertyDto.isVirtual,
      name: updatePropertyDto.name,
      thumbnail: updatePropertyDto.thumbnail,
    });
  }

  @Delete('/:id')
  @RequireOrganizationPermission({ property: ['delete'] })
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Delete Property' })
  @ApiOkResponse({ type: GetPropertyResponseDto })
  @ApiErrorsResponse()
  deleteProperty(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DeleteQueryDto,
  ) {
    return this.propertiesService.properties.deleteProperty({
      id,
      queryBuilder: { v: query.v },
      purge: query.purge,
    });
  }
}
