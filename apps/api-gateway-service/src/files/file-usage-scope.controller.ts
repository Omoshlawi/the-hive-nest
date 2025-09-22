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
} from '@mguay/nestjs-better-auth';
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
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

@UseGuards(AuthGuard)
@Controller('files/usage-scope')
export class FileUsageScopeController {
  constructor(private readonly fileService: HiveFileServiceClient) {}
  @Get('/')
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
