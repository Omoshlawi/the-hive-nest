/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  CreatIdentifierSequenceDto,
  HiveReferencesServiceClient,
  QueryIdentifierSequenceDto,
} from '@hive/reference';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiDetailTransformInterceptor,
  ApiListTransformInterceptor,
} from '../app.interceptors';
import { ApiOperation } from '@nestjs/swagger';
import { CustomRepresentationQueryDto, DeleteQueryDto } from '@hive/common';

@Controller('identifier-sequence')
export class IdentifierSequenceController {
  constructor(private referencesService: HiveReferencesServiceClient) {}

  @Get('/')
  @UseInterceptors(ApiListTransformInterceptor)
  @ApiOperation({ summary: 'Query Identifier sequence' })
  queryAmenity(@Query() query: QueryIdentifierSequenceDto) {
    return this.referencesService.identifierSequence.queryIdentifierSequence({
      queryBuilder: undefined,
      dataModel: query?.dataModel,
      updatedAtTo: query.updatedAtTo,
      updatedAtFrom: query?.updatedAtFrom,
    });
  }

  @Post('/')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Create Idenfier sequence' })
  createCategory(
    @Body() createCategoryDto: CreatIdentifierSequenceDto,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.referencesService.identifierSequence.createIdentifierSequence({
      queryBuilder: {
        v: query.v,
      },
      ...createCategoryDto,
    });
  }

  @Delete('/:id')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Delete Identifier Sequence' })
  deleteCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DeleteQueryDto,
  ) {
    return this.referencesService.identifierSequence.deleteIdentifierSequence({
      id,
      queryBuilder: { v: query.v },
      purge: query.purge,
    });
  }
}
