/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ApiErrorsResponse, DeleteQueryDto } from '@hive/common';
import {
  GetAddressHierarchyResponseDto,
  HiveReferencesServiceClient,
  QueryAddressHierarchyDto,
  QueryAddressHierarchyResponseDto,
} from '@hive/reference';
import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { OptionalAuth } from '@thallesp/nestjs-better-auth';
import {
  ApiDetailTransformInterceptor,
  ApiListTransformInterceptor,
} from '../app.interceptors';

@Controller('address-hierarchy')
export class AddressHierarchyController {
  constructor(private reference: HiveReferencesServiceClient) {}
  @Get('/')
  @OptionalAuth()
  @UseInterceptors(ApiListTransformInterceptor)
  @ApiOperation({ summary: 'Query AddressHierarchy' })
  @ApiOkResponse({ type: QueryAddressHierarchyResponseDto })
  @ApiErrorsResponse()
  queryAddressHierarchy(@Query() query: QueryAddressHierarchyDto) {
    return this.reference.addressHierarchy.queryAddressHierarchy({
      queryBuilder: {
        limit: query.limit,
        orderBy: query.orderBy,
        page: query.page,
        v: query.v,
      },
      includeVoided: query.includeVoided,
      search: query.search,
      code: query.code,
      country: query.country,
      level: query.level,
      name: query.name,
      nameLocal: query.nameLocal,
      parentId: query.parentId,
      parentCode: query.parentCode,
      parentCountry: query.parentCountry,
      parentLevel: query.parentLevel,
      parentName: query.parentName,
      parentNameLocal: query.parentNameLocal,
    });
  }

  @Delete('/:id')
  //   @RequireSystemPermission({ addressHierarchy: ['delete'] })
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Delete AddressHierarchy' })
  @ApiOkResponse({ type: GetAddressHierarchyResponseDto })
  @ApiErrorsResponse()
  deleteAddressHierarchy(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DeleteQueryDto,
  ) {
    return this.reference.addressHierarchy.deleteAddressHierarchy({
      id,
      queryBuilder: { v: query.v },
      purge: query.purge,
    });
  }
}
