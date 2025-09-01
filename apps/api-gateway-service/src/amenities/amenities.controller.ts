import {
  GetAmenityDto,
  HiveProperyServiceClient,
  QueryAmenityDto,
} from '@hive/property';
import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

@Controller('amenities')
export class AmenitiesController {
  constructor(private propertyservice: HiveProperyServiceClient) {}
  @Get('/')
  @ApiOperation({ summary: 'Query Amenities' })
  queryAmenity(@Query() query: QueryAmenityDto) {
    return this.propertyservice.queryAmenities({
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
  @Get('/:id')
  @ApiOperation({ summary: 'Query Amenities' })
  getAmenity(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: GetAmenityDto,
  ) {
    return this.propertyservice.getAmenity({ id, queryBuilder: query });
  }
}
