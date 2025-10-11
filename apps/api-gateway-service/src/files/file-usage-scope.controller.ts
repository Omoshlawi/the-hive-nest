import { CustomRepresentationQueryDto, DeleteQueryDto } from '@hive/common';
import {
  CreatFileUsageScopeDto,
  HiveFileServiceClient,
  QueryFileUsageScopeDto,
  UpdateFileUsageScopeDto,
} from '@hive/files';
import {
  AuthGuard,
  Public,
  Session,
  UserSession,
} from '@thallesp/nestjs-better-auth';
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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import {
  ApiDetailTransformInterceptor,
  ApiListTransformInterceptor,
} from '../app.interceptors';

@UseGuards(AuthGuard)
@Controller('files/usage-scope')
export class FileUsageScopeController {
  constructor(private readonly fileService: HiveFileServiceClient) {}
  @Get('/')
  @UseInterceptors(ApiListTransformInterceptor)
  @Public()
  @ApiOperation({ summary: 'Query File Usage Scope' })
  queryFileUsageScope(@Query() query: QueryFileUsageScopeDto) {
    return this.fileService.fileUsageScope.queryFileUsageScope({
      queryBuilder: {
        limit: query.limit,
        orderBy: query.orderBy,
        page: query.page,
        v: query.v,
      },
      includeVoided: query.includeVoided,
      modelName: query.modelName,
      purpose: query.purpose,
      search: query.search,
    });
  }
  @Get('/:id')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @Public()
  @ApiOperation({ summary: 'Get File usage scope' })
  getFileUsageScope(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.fileService.fileUsageScope.getFileUsageScope({
      id,
      queryBuilder: query,
    });
  }
  @Post('/')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Create File Usage Scope' })
  createFileUsageScope(
    @Body() createFileUsageScopeDto: CreatFileUsageScopeDto,
    @Query() query: CustomRepresentationQueryDto,
    @Session() { user }: UserSession,
  ) {
    return this.fileService.fileUsageScope.createFileUsageScope({
      queryBuilder: {
        v: query.v,
      },
      context: { userId: user.id },
      ...createFileUsageScopeDto,
    });
  }
  @Patch('/:id')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Update File Usage scope' })
  updateFileUsageScope(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateFileUsageScopeDto: UpdateFileUsageScopeDto,
    @Query() query: CustomRepresentationQueryDto,
    @Session() { user }: UserSession,
  ) {
    return this.fileService.fileUsageScope.updateFileUsageScope({
      id,
      queryBuilder: { v: query?.v },
      context: { userId: user.id },
      ...updateFileUsageScopeDto,
    });
  }
  @Delete('/:id')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Delete File usage Scope' })
  deleteFileUsageScope(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DeleteQueryDto,
    @Session() { user }: UserSession,
  ) {
    return this.fileService.fileUsageScope.deleteFileUsageScope({
      id,
      queryBuilder: { v: query.v },
      purge: query.purge,
      context: { userId: user.id },
    });
  }
}
