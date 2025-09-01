import { CustomRepresentationQueryDto, DeleteQueryDto } from '@hive/common';
import {
  CreatAttributeTypeDto,
  HivePropertyServiceClient,
  QueryAttributeTypeDto,
  UpdateAttributeTypeDto,
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

@Controller('attribute-types')
export class AttributeTypesController {
  constructor(private propertyservice: HivePropertyServiceClient) {}
  @Get('/')
  @ApiOperation({ summary: 'Query attribute types' })
  queryAttributeType(@Query() query: QueryAttributeTypeDto) {
    return this.propertyservice.queryAttributeTypes({
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
  @ApiOperation({ summary: 'Create AttributeType' })
  createAttributeType(
    @Body() createAttributeTypeDto: CreatAttributeTypeDto,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.propertyservice.createAttributeType({
      queryBuilder: {
        v: query.v,
      },
      ...createAttributeTypeDto,
    });
  }
  @Get('/:id')
  @ApiOperation({ summary: 'Get AttributeType' })
  getAttributeType(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.propertyservice.getAttributeType({ id, queryBuilder: query });
  }
  @Patch('/:id')
  @ApiOperation({ summary: 'Update AttributeType' })
  updateAttributeType(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAttributeTypeDto: UpdateAttributeTypeDto,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.propertyservice.updateAttributeType({
      id,
      queryBuilder: { v: query?.v },
      ...updateAttributeTypeDto,
    });
  }
  @Delete('/:id')
  @ApiOperation({ summary: 'Delete AttributeType' })
  deleteAttributeType(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DeleteQueryDto,
  ) {
    return this.propertyservice.deleteAttributeType({
      id,
      queryBuilder: { v: query.v },
      purge: query.purge,
    });
  }
}
