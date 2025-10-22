import {
  ApiErrorsResponse,
  CustomRepresentationQueryDto,
  DeleteQueryDto,
} from '@hive/common';
import {
  CreatAttributeTypeDto,
  GetAttributeTypeResponseDto,
  HivePropertyServiceClient,
  QueryAttributeTypeDto,
  QueryAttributeTypeResponseDto,
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
import { OptionalAuth } from '@thallesp/nestjs-better-auth';
import { RequireSystemPermission } from '../auth/auth.decorators';

@Controller('attribute-types')
export class AttributeTypesController {
  constructor(private propertyservice: HivePropertyServiceClient) {}
  @Get('/')
  @OptionalAuth()
  @UseInterceptors(ApiListTransformInterceptor)
  @ApiOperation({ summary: 'Query attribute types' })
  @ApiOkResponse({ type: QueryAttributeTypeResponseDto })
  @ApiErrorsResponse()
  queryAttributeType(@Query() query: QueryAttributeTypeDto) {
    return this.propertyservice.attributeTypes.queryAttributeTypes({
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
  @RequireSystemPermission({ attributeType: ['create'] })
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Create AttributeType' })
  @ApiCreatedResponse({ type: GetAttributeTypeResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  createAttributeType(
    @Body() createAttributeTypeDto: CreatAttributeTypeDto,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.propertyservice.attributeTypes.createAttributeType({
      queryBuilder: {
        v: query.v,
      },
      ...createAttributeTypeDto,
    });
  }
  @Get('/:id')
  @OptionalAuth()
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Get AttributeType' })
  @ApiOkResponse({ type: GetAttributeTypeResponseDto })
  @ApiErrorsResponse()
  getAttributeType(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.propertyservice.attributeTypes.getAttributeType({
      id,
      queryBuilder: query,
    });
  }
  @Patch('/:id')
  @RequireSystemPermission({ attributeType: ['update'] })
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Update AttributeType' })
  @ApiOkResponse({ type: GetAttributeTypeResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  updateAttributeType(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAttributeTypeDto: UpdateAttributeTypeDto,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.propertyservice.attributeTypes.updateAttributeType({
      id,
      queryBuilder: { v: query?.v },
      ...updateAttributeTypeDto,
    });
  }
  @Delete('/:id')
  @RequireSystemPermission({ attributeType: ['delete'] })
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Delete AttributeType' })
  @ApiOkResponse({ type: GetAttributeTypeResponseDto })
  @ApiErrorsResponse()
  deleteAttributeType(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DeleteQueryDto,
  ) {
    return this.propertyservice.attributeTypes.deleteAttributeType({
      id,
      queryBuilder: { v: query.v },
      purge: query.purge,
    });
  }
}
