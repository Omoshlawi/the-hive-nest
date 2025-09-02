import { CustomRepresentationQueryDto, DeleteQueryDto } from '@hive/common';
import {
  CreatRelationshipTypeDto,
  HivePropertyServiceClient,
  QueryRelationshipTypeDto,
  UpdateRelationshipTypeDto,
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
@Controller('relationship-types')
export class RelationshipTypesController {
  constructor(private propertyservice: HivePropertyServiceClient) {}
  @Get('/')
  @ApiOperation({ summary: 'Query Relationship types' })
  queryRelationshipType(@Query() query: QueryRelationshipTypeDto) {
    return this.propertyservice.queryRelationshipType({
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
  @ApiOperation({ summary: 'Create RelationshipType' })
  createRelationshipType(
    @Body() createRelationshipTypeDto: CreatRelationshipTypeDto,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.propertyservice.createRelationshipType({
      queryBuilder: {
        v: query.v,
      },
      ...createRelationshipTypeDto,
    });
  }
  @Get('/:id')
  @ApiOperation({ summary: 'Get RelationshipType' })
  getRelationshipType(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.propertyservice.getRelationshipType({
      id,
      queryBuilder: query,
    });
  }
  @Patch('/:id')
  @ApiOperation({ summary: 'Update RelationshipType' })
  updateRelationshipType(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRelationshipTypeDto: UpdateRelationshipTypeDto,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.propertyservice.updateRelationshipType({
      id,
      queryBuilder: { v: query?.v },
      ...updateRelationshipTypeDto,
    });
  }
  @Delete('/:id')
  @ApiOperation({ summary: 'Delete RelationshipType' })
  deleteRelationshipType(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DeleteQueryDto,
  ) {
    return this.propertyservice.deleteRelationshipType({
      id,
      queryBuilder: { v: query.v },
      purge: query.purge,
    });
  }
}
