import {
  ApiErrorsResponse,
  CustomRepresentationQueryDto,
  DeleteQueryDto,
} from '@hive/common';
import {
  CreatePropertyAttributeDto,
  GetPropertyAttributeResponseDto,
  HivePropertyServiceClient,
  QueryPropertyAttributeDto,
  QueryPropertyAttributeResponseDto,
  UpdatePropertyAttributeDto,
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
import { RequireOrganizationPermission } from '../auth/auth.decorators';

@Controller('properties/:propertyId/attributes')
@ApiTags('Properties', 'Property Attributes')
export class PropertyAttributeController {
  constructor(private propertyService: HivePropertyServiceClient) {}

  @Get('/')
  @UseInterceptors(ApiListTransformInterceptor)
  @ApiOperation({ summary: 'Query PropertyAttribute' })
  @ApiOkResponse({ type: QueryPropertyAttributeResponseDto })
  @ApiErrorsResponse()
  queryPropertyAttribute(@Query() query: QueryPropertyAttributeDto) {
    return this.propertyService.propertyAttributes.queryPropertyAttribute({
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
  @RequireOrganizationPermission({ property: ['update'] })
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Create PropertyAttribute' })
  @ApiCreatedResponse({ type: GetPropertyAttributeResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  createPropertyAttribute(
    @Body() createPropertyAttributeDto: CreatePropertyAttributeDto,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.propertyService.propertyAttributes.createPropertyAttribute({
      queryBuilder: {
        v: query.v,
      },
      ...createPropertyAttributeDto,
    });
  }

  @Get('/:id')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Get PropertyAttribute' })
  @ApiOkResponse({ type: GetPropertyAttributeResponseDto })
  @ApiErrorsResponse()
  getPropertyAttribute(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.propertyService.propertyAttributes.getPropertyAttribute({
      id,
      queryBuilder: query,
    });
  }

  @Patch('/:id')
  @RequireOrganizationPermission({ property: ['update'] })
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Update PropertyAttribute' })
  @ApiOkResponse({ type: GetPropertyAttributeResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  updatePropertyAttribute(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePropertyAttributeDto: UpdatePropertyAttributeDto,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.propertyService.propertyAttributes.updatePropertyAttribute({
      id,
      queryBuilder: { v: query?.v },
      ...updatePropertyAttributeDto,
    });
  }

  @Delete('/:id')
  @RequireOrganizationPermission({ property: ['update'] })
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Delete PropertyAttribute' })
  @ApiOkResponse({ type: GetPropertyAttributeResponseDto })
  @ApiErrorsResponse()
  deletePropertyAttribute(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DeleteQueryDto,
  ) {
    return this.propertyService.propertyAttributes.deletePropertyAttribute({
      id,
      queryBuilder: { v: query.v },
      purge: query.purge,
    });
  }
}
