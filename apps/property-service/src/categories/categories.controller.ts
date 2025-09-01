import {
  CreateCategoryRequest,
  DeleteCategoryRequest,
  GetCategoryRequest,
  GetCategoryResponse,
  PROPERTY_SERVICE_NAME,
  QueryCategoryRequest,
  QueryCategoryResponse,
  UpdateCategoryRequest,
} from '@hive/property';
import { Controller, NotFoundException } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoryService: CategoriesService) {}
  @GrpcMethod(PROPERTY_SERVICE_NAME, 'queryCategories')
  queryCategories(
    request: QueryCategoryRequest,
  ): Promise<QueryCategoryResponse> {
    return this.categoryService.getAll(
      request,
    ) as unknown as Promise<QueryCategoryResponse>;
  }
  @GrpcMethod(PROPERTY_SERVICE_NAME, 'getCategory')
  async getCategory(request: GetCategoryRequest): Promise<GetCategoryResponse> {
    const res = await this.categoryService.getById(request);
    if (!res.data)
      throw new RpcException(new NotFoundException('Category not found'));
    return res as unknown as GetCategoryResponse;
  }
  @GrpcMethod(PROPERTY_SERVICE_NAME, 'createCategory')
  createCategory(request: CreateCategoryRequest): Promise<GetCategoryResponse> {
    return this.categoryService.create(
      request,
    ) as unknown as Promise<GetCategoryResponse>;
  }
  @GrpcMethod(PROPERTY_SERVICE_NAME, 'updateCategory')
  updateCategory(request: UpdateCategoryRequest): Promise<GetCategoryResponse> {
    return this.categoryService.update(
      request,
    ) as unknown as Promise<GetCategoryResponse>;
  }
  @GrpcMethod(PROPERTY_SERVICE_NAME, 'deleteCategory')
  deleteCategory(request: DeleteCategoryRequest): Promise<GetCategoryResponse> {
    return this.categoryService.delete(
      request,
    ) as unknown as Promise<GetCategoryResponse>;
  }
}
