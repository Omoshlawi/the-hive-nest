/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  ApiErrorsResponse,
  CustomRepresentationQueryDto,
  DeleteQueryDto,
} from '@hive/common';
import {
  CreatCategoryDto,
  GetCategoryResponseDto,
  HivePropertyServiceClient,
  QueryCategoryDto,
  QueryCategoryResponseDto,
  UpdateCategoryDto,
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
@Controller('categories')
export class CategoriesController {
  constructor(private propertyservice: HivePropertyServiceClient) {}
  @Get('/')
  @UseInterceptors(ApiListTransformInterceptor)
  @ApiOperation({ summary: 'Query Categories' })
  @ApiOkResponse({ type: QueryCategoryResponseDto })
  @ApiErrorsResponse()
  queryCategory(@Query() query: QueryCategoryDto) {
    return this.propertyservice.categories.queryCategories({
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
  @ApiOperation({ summary: 'Create Category' })
  @ApiCreatedResponse({ type: GetCategoryResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  createCategory(
    @Body() createCategoryDto: CreatCategoryDto,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.propertyservice.categories.createCategory({
      queryBuilder: {
        v: query.v,
      },
      ...createCategoryDto,
    });
  }
  @Get('/:id')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Get Category' })
  @ApiOkResponse({ type: GetCategoryResponseDto })
  @ApiErrorsResponse()
  getCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.propertyservice.categories.getCategory({
      id,
      queryBuilder: query,
    });
  }
  @Patch('/:id')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Update Category' })
  @ApiOkResponse({ type: GetCategoryResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.propertyservice.categories.updateCategory({
      id,
      queryBuilder: { v: query?.v },
      ...updateCategoryDto,
    });
  }
  @Delete('/:id')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Delete Category' })
  @ApiOkResponse({ type: GetCategoryResponseDto })
  @ApiErrorsResponse()
  deleteCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DeleteQueryDto,
  ) {
    return this.propertyservice.categories.deleteCategory({
      id,
      queryBuilder: { v: query.v },
      purge: query.purge,
    });
  }
}
