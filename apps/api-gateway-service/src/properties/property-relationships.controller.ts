/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ApiErrorsResponse,
  CustomRepresentationQueryDto,
  DeleteQueryDto,
} from '@hive/common';
import {
  CreatePropertyRelationshipDto,
  GetPropertyRelationshipResponseDto,
  HivePropertyServiceClient,
  QueryPropertyRelationshipDto,
  QueryPropertyRelationshipResponseDto,
  UpdatePropertyRelationshipDto,
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

@Controller('properties/:propertyId/relationships')
@ApiTags('Properties', 'Property Relationships')
export class PropertyRelationshipController {
  constructor(private propertyService: HivePropertyServiceClient) {}

  @Get('/')
  @UseInterceptors(ApiListTransformInterceptor)
  @ApiOperation({ summary: 'Query PropertyRelationship' })
  @ApiOkResponse({ type: QueryPropertyRelationshipResponseDto })
  @ApiErrorsResponse()
  queryPropertyRelationship(@Query() query: QueryPropertyRelationshipDto) {
    return this.propertyService.relationships.queryRelationship({
      queryBuilder: {
        limit: query.limit,
        orderBy: query.orderBy,
        page: query.page,
        v: query.v,
      },
      includeVoided: query.includeVoided,
      search: query.search,
    });
  }

  @Post('/')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Create PropertyRelationship' })
  @ApiCreatedResponse({ type: GetPropertyRelationshipResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  createPropertyRelationship(
    @Body() createPropertyRelationshipDto: CreatePropertyRelationshipDto,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.propertyService.relationships.createRelationship({
      queryBuilder: {
        v: query.v,
      },
      ...createPropertyRelationshipDto,
    });
  }

  @Get('/:id')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Get PropertyRelationship' })
  @ApiOkResponse({ type: GetPropertyRelationshipResponseDto })
  @ApiErrorsResponse()
  getPropertyRelationship(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.propertyService.relationships.getRelationship({
      id,
      queryBuilder: query,
    });
  }

  @Patch('/:id')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Update PropertyRelationship' })
  @ApiOkResponse({ type: GetPropertyRelationshipResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  updatePropertyRelationship(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePropertyRelationshipDto: UpdatePropertyRelationshipDto,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.propertyService.relationships.updateRelationship({
      id,
      queryBuilder: { v: query?.v },
      ...updatePropertyRelationshipDto,
    });
  }

  @Delete('/:id')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Delete PropertyRelationship' })
  @ApiOkResponse({ type: GetPropertyRelationshipResponseDto })
  @ApiErrorsResponse()
  deletePropertyRelationship(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DeleteQueryDto,
  ) {
    return this.propertyService.relationships.deleteRelationship({
      id,
      queryBuilder: { v: query.v },
      purge: query.purge,
    });
  }
}
