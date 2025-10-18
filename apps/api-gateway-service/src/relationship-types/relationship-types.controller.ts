/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  ApiErrorsResponse,
  CustomRepresentationQueryDto,
  DeleteQueryDto,
} from '@hive/common';
import {
  CreatRelationshipTypeDto,
  GetRelationshipTypeResponseDto,
  HivePropertyServiceClient,
  QueryRelationshipTypeDto,
  QueryRelationshipTypeResponseDto,
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
@Controller('relationship-types')
export class RelationshipTypesController {
  constructor(private propertyservice: HivePropertyServiceClient) {}
  @Get('/')
  @UseInterceptors(ApiListTransformInterceptor)
  @ApiOperation({ summary: 'Query Relationship types' })
  @ApiOkResponse({ type: QueryRelationshipTypeResponseDto })
  @ApiErrorsResponse()
  queryRelationshipType(@Query() query: QueryRelationshipTypeDto) {
    return this.propertyservice.relationshipTypes.queryRelationshipType({
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
  @ApiOperation({ summary: 'Create RelationshipType' })
  @ApiCreatedResponse({ type: GetRelationshipTypeResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  createRelationshipType(
    @Body() createRelationshipTypeDto: CreatRelationshipTypeDto,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.propertyservice.relationshipTypes.createRelationshipType({
      queryBuilder: {
        v: query.v,
      },
      ...createRelationshipTypeDto,
    });
  }
  @Get('/:id')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Get RelationshipType' })
  @ApiOkResponse({ type: GetRelationshipTypeResponseDto })
  @ApiErrorsResponse()
  getRelationshipType(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.propertyservice.relationshipTypes.getRelationshipType({
      id,
      queryBuilder: query,
    });
  }
  @Patch('/:id')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Update RelationshipType' })
  @ApiOkResponse({ type: GetRelationshipTypeResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  updateRelationshipType(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRelationshipTypeDto: UpdateRelationshipTypeDto,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.propertyservice.relationshipTypes.updateRelationshipType({
      id,
      queryBuilder: { v: query?.v },
      ...updateRelationshipTypeDto,
    });
  }
  @Delete('/:id')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Delete RelationshipType' })
  @ApiOkResponse({ type: GetRelationshipTypeResponseDto })
  @ApiErrorsResponse()
  deleteRelationshipType(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DeleteQueryDto,
  ) {
    return this.propertyservice.relationshipTypes.deleteRelationshipType({
      id,
      queryBuilder: { v: query.v },
      purge: query.purge,
    });
  }
}
