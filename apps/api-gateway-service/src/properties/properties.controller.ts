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
  UseGuards,
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
import { AuthGuard } from '@thallesp/nestjs-better-auth';

@UseGuards(AuthGuard)
@Controller('properties')
export class PropertiesController {
  constructor(private propertiesService: HivePropertyServiceClient) {}

  @Get('/')
  @UseInterceptors(ApiListTransformInterceptor)
  @ApiOperation({ summary: 'Query Property' })
  @ApiOkResponse({ type: QueryPropertyResponseDto })
  @ApiErrorsResponse()
  queryProperty(@Query() query: QueryPropertyDto) {
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
      context: {},
      isVirtual: query.isVirtual,
      status: query.status,
    });
  }

  @Post('/')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Create Property' })
  @ApiCreatedResponse({ type: GetPropertyResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  createProperty(
    @Body() createPropertyDto: CreatePropertyDto,
    @Query() query: CustomRepresentationQueryDto,
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
        organizationId: '',
        userId: '',
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
