import { CustomRepresentationQueryDto, DeleteQueryDto } from '@hive/common';
import {
  CreatCategoryDto,
  HivePropertyServiceClient,
  QueryCategoryDto,
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
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
@Controller('categories')
export class CategoriesController {
  constructor(private propertyservice: HivePropertyServiceClient) {}
  @Get('/')
  @ApiOperation({ summary: 'Query Categories' })
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
  @ApiOperation({ summary: 'Create Category' })
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
  @ApiOperation({ summary: 'Get Category' })
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
  @ApiOperation({ summary: 'Update Category' })
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
  @ApiOperation({ summary: 'Delete Category' })
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
