/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
import {
  ApiDetailTransformInterceptor,
  ApiListTransformInterceptor,
} from '../app.interceptors';

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
      attributeIds: [],
      //   attributeIds: query.attributes,
      amenityIds: query.amenities ?? [],
      categoryIds: query.categories ?? [],
      addressId: query.address,
      context: {},
      isVirtual: query.isVirtual,
      status: '',
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
      organizationId: '',
      createdBy: '',
      status: '',
      amenityIds: [],
      categoryIds: [],
      isVirtual: false,
      name: '',
      addressId: '',
      attributes: '',
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
      amenityIds: [],
      categoryIds: [],
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
