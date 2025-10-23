import {
  ApiErrorsResponse,
  CustomRepresentationQueryDto,
  DeleteQueryDto,
} from '@hive/common';
import {
  CreatePropertyCategoryDto,
  GetPropertyCategoryResponseDto,
  HivePropertyServiceClient,
  QueryPropertyCategoryDto,
  QueryPropertyCategoryResponseDto,
  UpdatePropertyCategoryDto,
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

@Controller('properties/:propertyId/categories')
@ApiTags('Properties', 'Property Categories')
export class PropertyCategoryController {
  constructor(private propertyService: HivePropertyServiceClient) {}

  @Get('/')
  @UseInterceptors(ApiListTransformInterceptor)
  @ApiOperation({ summary: 'Query PropertyCategory' })
  @ApiOkResponse({ type: QueryPropertyCategoryResponseDto })
  @ApiErrorsResponse()
  queryPropertyCategory(@Query() query: QueryPropertyCategoryDto) {
    return this.propertyService.propertyCategories.queryPropertyCategory({
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
  @ApiOperation({ summary: 'Create PropertyCategory' })
  @ApiCreatedResponse({ type: GetPropertyCategoryResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  createPropertyCategory(
    @Body() createPropertyCategoryDto: CreatePropertyCategoryDto,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.propertyService.propertyCategories.createPropertyCategory({
      queryBuilder: {
        v: query.v,
      },
      ...createPropertyCategoryDto,
    });
  }

  @Get('/:id')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Get PropertyCategory' })
  @ApiOkResponse({ type: GetPropertyCategoryResponseDto })
  @ApiErrorsResponse()
  getPropertyCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.propertyService.propertyCategories.getPropertyCategory({
      id,
      queryBuilder: query,
    });
  }

  @Patch('/:id')
  @RequireOrganizationPermission({ property: ['update'] })
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Update PropertyCategory' })
  @ApiOkResponse({ type: GetPropertyCategoryResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  updatePropertyCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePropertyCategoryDto: UpdatePropertyCategoryDto,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.propertyService.propertyCategories.updatePropertyCategory({
      id,
      queryBuilder: { v: query?.v },
      ...updatePropertyCategoryDto,
    });
  }

  @Delete('/:id')
  @RequireOrganizationPermission({ property: ['update'] })
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Delete PropertyCategory' })
  @ApiOkResponse({ type: GetPropertyCategoryResponseDto })
  @ApiErrorsResponse()
  deletePropertyCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DeleteQueryDto,
  ) {
    return this.propertyService.propertyCategories.deletePropertyCategory({
      id,
      queryBuilder: { v: query.v },
      purge: query.purge,
    });
  }
}
