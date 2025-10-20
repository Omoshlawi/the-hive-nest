/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ApiErrorsResponse, CustomRepresentationQueryDto } from '@hive/common';
import {
  GetStatusHistoryEntryResponseDto,
  HivePropertyServiceClient,
} from '@hive/property';
import {
  Body,
  Controller,
  Param,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { ApiDetailTransformInterceptor } from 'src/app.interceptors';

@Controller('properties/:propertyId/workflow')
@ApiTags('Properties', 'Property Workflow')
export class PropertyStatusHistoryController {
  constructor(private propertyService: HivePropertyServiceClient) {}

  @Post('/request-review')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Submit draft property for review' })
  @ApiCreatedResponse({ type: GetStatusHistoryEntryResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  requestReview(
    @Param('propertyId') propertyId: string,
    @Query() query: CustomRepresentationQueryDto,
  ) {}
  @Post('/approve')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Approve pending property' })
  @ApiCreatedResponse({ type: GetStatusHistoryEntryResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  approve(
    @Param('propertyId') propertyId: string,
    @Query() query: CustomRepresentationQueryDto,
  ) {}
}
