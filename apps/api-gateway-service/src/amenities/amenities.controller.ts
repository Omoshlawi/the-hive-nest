/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ApiErrorsResponse,
  CustomRepresentationQueryDto,
  DeleteQueryDto,
} from '@hive/common';
import {
  CreatAmenityDto,
  GetAmenityResponseDto,
  HivePropertyServiceClient,
  QueryAmenityDto,
  QueryAmenityResponseDto,
  UpdateAmenityDto,
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

@Controller('amenities')
export class AmenitiesController {
  constructor(private propertyservice: HivePropertyServiceClient) {}
  @Get('/')
  @UseInterceptors(ApiListTransformInterceptor)
  @ApiOperation({ summary: 'Query Amenities' })
  @ApiOkResponse({ type: QueryAmenityResponseDto })
  @ApiErrorsResponse()
  queryAmenity(@Query() query: QueryAmenityDto) {
    return this.propertyservice.amenities.queryAmenities({
      queryBuilder: {
        limit: query.limit,
        orderBy: query.orderBy,
        page: query.page,
        v: query.v,
      },
      includeVoided: query.includeVoided,
      organizationId: query.orderBy,
      search: query.search,
    });
  }
  @Post('/')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Create Amenity' })
  @ApiCreatedResponse({ type: GetAmenityResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  createAmenity(
    @Body() createAmenityDto: CreatAmenityDto,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.propertyservice.amenities.createAmenity({
      queryBuilder: {
        v: query.v,
      },
      ...createAmenityDto,
    });
  }
  @Get('/:id')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Get Amenity' })
  @ApiOkResponse({ type: GetAmenityResponseDto })
  @ApiErrorsResponse()
  getAmenity(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.propertyservice.amenities.getAmenity({
      id,
      queryBuilder: query,
    });
  }
  @Patch('/:id')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Update Amenity' })
  @ApiOkResponse({ type: GetAmenityResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  updateAmenity(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAmenityDto: UpdateAmenityDto,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.propertyservice.amenities.updateAmenity({
      id,
      queryBuilder: { v: query?.v },
      ...updateAmenityDto,
    });
  }
  @Delete('/:id')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Delete Amenity' })
  @ApiOkResponse({ type: GetAmenityResponseDto })
  @ApiErrorsResponse()
  deleteAmenity(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DeleteQueryDto,
  ) {
    return this.propertyservice.amenities.deleteAmenity({
      id,
      queryBuilder: { v: query.v },
      purge: query.purge,
    });
  }
}
