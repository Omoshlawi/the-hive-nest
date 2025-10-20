/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ApiErrorsResponse,
  CustomRepresentationQueryDto,
  DeleteQueryDto,
} from '@hive/common';
import {
  CreatePropertyAmenityDto,
  GetPropertyAmenityResponseDto,
  HivePropertyServiceClient,
  QueryPropertyAmenityDto,
  QueryPropertyAmenityResponseDto,
  UpdatePropertyAmenityDto,
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
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiDetailTransformInterceptor,
  ApiListTransformInterceptor,
} from '../app.interceptors';

@Controller('properties/:propertyId/amenities')
@ApiTags('Properties', 'Property Amenities')
export class PropertyAmenityController {
  constructor(private propertyService: HivePropertyServiceClient) {}

  @Get('/')
  @UseInterceptors(ApiListTransformInterceptor)
  @ApiOperation({ summary: 'Query PropertyAmenity' })
  @ApiOkResponse({ type: QueryPropertyAmenityResponseDto })
  @ApiErrorsResponse()
  queryPropertyAmenity(@Query() query: QueryPropertyAmenityDto) {
    return this.propertyService.propertyAmenities.queryPropertyAmenity({
      queryBuilder: {
        limit: query.limit,
        orderBy: query.orderBy,
        page: query.page,
        v: query.v,
      },
      includeVoided: query.includeVoided,
    });
  }

  @Post('/')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Create PropertyAmenity' })
  @ApiCreatedResponse({ type: GetPropertyAmenityResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  createPropertyAmenity(
    @Body() createPropertyAmenityDto: CreatePropertyAmenityDto,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.propertyService.propertyAmenities.createPropertyAmenity({
      queryBuilder: {
        v: query.v,
      },
      ...createPropertyAmenityDto,
    });
  }

  @Get('/:id')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Get PropertyAmenity' })
  @ApiOkResponse({ type: GetPropertyAmenityResponseDto })
  @ApiErrorsResponse()
  getPropertyAmenity(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.propertyService.propertyAmenities.getPropertyAmenity({
      id,
      queryBuilder: query,
    });
  }

  @Patch('/:id')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Update PropertyAmenity' })
  @ApiOkResponse({ type: GetPropertyAmenityResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  updatePropertyAmenity(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePropertyAmenityDto: UpdatePropertyAmenityDto,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.propertyService.propertyAmenities.updatePropertyAmenity({
      id,
      queryBuilder: { v: query?.v },
      ...updatePropertyAmenityDto,
    });
  }

  @Delete('/:id')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Delete PropertyAmenity' })
  @ApiOkResponse({ type: GetPropertyAmenityResponseDto })
  @ApiErrorsResponse()
  deletePropertyAmenity(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DeleteQueryDto,
  ) {
    return this.propertyService.propertyAmenities.deletePropertyAmenity({
      id,
      queryBuilder: { v: query.v },
      purge: query.purge,
    });
  }
}
