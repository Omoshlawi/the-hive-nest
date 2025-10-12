import { CustomRepresentationQueryDto, DeleteQueryDto } from '@hive/common';
import {
  CreatFileUsageRuleDto,
  HiveFileServiceClient,
  QueryFileUsageRuleDto,
  UpdateFileUsageRuleDto,
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
@Controller('files/usage-rules')
export class FileUsageRuleController {
  constructor(private readonly fileService: HiveFileServiceClient) {}
  @Get('/')
  @Public()
  @ApiOperation({ summary: 'Query File Usage Rule' })
  @UseInterceptors(ApiListTransformInterceptor)
  queryFileUsageRule(@Query() query: QueryFileUsageRuleDto) {
    return this.fileService.fileUsageRule.queryFileUsageRule({
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
      scopeId: query.scopeId,
    });
  }
  @Get('/:id')
  @ApiOperation({ summary: 'Get File usage Rule' })
  @UseInterceptors(ApiDetailTransformInterceptor)
  getFileUsageRule(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.fileService.fileUsageRule.getFileUsageRule({
      id,
      queryBuilder: query,
    });
  }
  @Post('/')
  @ApiOperation({ summary: 'Create File Usage Rule' })
  @UseInterceptors(ApiDetailTransformInterceptor)
  createFileUsageRule(
    @Body() createFileUsageRuleDto: CreatFileUsageRuleDto,
    @Query() query: CustomRepresentationQueryDto,
    @Session() { user }: UserSession,
  ) {
    return this.fileService.fileUsageRule.createFileUsageRule({
      queryBuilder: {
        v: query.v,
      },
      context: { userId: user.id },
      ...createFileUsageRuleDto,
    });
  }
  @Patch('/:id')
  @ApiOperation({ summary: 'Update File Usage Rule' })
  @UseInterceptors(ApiDetailTransformInterceptor)
  updateFileUsageRule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateFileUsageRuleDto: UpdateFileUsageRuleDto,
    @Query() query: CustomRepresentationQueryDto,
    @Session() { user }: UserSession,
  ) {
    return this.fileService.fileUsageRule.updateFileUsageRule({
      id,
      queryBuilder: { v: query?.v },
      context: { userId: user.id },
      ...updateFileUsageRuleDto,
    });
  }
  @Delete('/:id')
  @ApiOperation({ summary: 'Delete File usage Rule' })
  @UseInterceptors(ApiDetailTransformInterceptor)
  deleteFileUsageRule(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DeleteQueryDto,
    @Session() { user }: UserSession,
  ) {
    return this.fileService.fileUsageRule.deleteFileUsageRule({
      id,
      queryBuilder: { v: query.v },
      purge: query.purge,
      context: { userId: user.id },
    });
  }
}
