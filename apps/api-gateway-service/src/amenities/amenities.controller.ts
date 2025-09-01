import { CustomRepresentationQueryDto, DeleteQueryDto } from '@hive/common';
import {
  CreatAmenityDto,
  HiveProperyServiceClient,
  QueryAmenityDto,
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
} from '@nestjs/common';
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
  @Post('/')
  @ApiOperation({ summary: 'Create Amenity' })
  createAmenity(
    @Body() createAmenityDto: CreatAmenityDto,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.propertyservice.createAmenity({
      queryBuilder: {
        v: query.v,
      },
      ...createAmenityDto,
    });
  }
  @Get('/:id')
  @ApiOperation({ summary: 'Get Amenity' })
  getAmenity(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.propertyservice.getAmenity({ id, queryBuilder: query });
  }
  @Patch('/:id')
  @ApiOperation({ summary: 'Update Amenity' })
  updateAmenity(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAmenityDto: UpdateAmenityDto,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.propertyservice.updateAmenity({
      id,
      queryBuilder: { v: query?.v },
      ...updateAmenityDto,
    });
  }
  @Delete('/:id')
  @ApiOperation({ summary: 'Delete Amenity' })
  deleteAmenity(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DeleteQueryDto,
  ) {
    return this.propertyservice.deleteAmenity({
      id,
      queryBuilder: { v: query.v },
      purge: query.purge,
    });
  }
}
