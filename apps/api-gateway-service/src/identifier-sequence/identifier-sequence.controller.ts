/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  HiveReferencesServiceClient,
  QueryIdentifierSequenceDto,
} from '@hive/reference';
import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { ApiListTransformInterceptor } from '../app.interceptors';
import { ApiOperation } from '@nestjs/swagger';

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
}
