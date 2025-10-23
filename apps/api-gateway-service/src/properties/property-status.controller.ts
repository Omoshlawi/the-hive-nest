import { ApiErrorsResponse, CustomRepresentationQueryDto } from '@hive/common';
import {
  GetStatusHistoryEntryResponseDto,
  HivePropertyServiceClient,
} from '@hive/property';
import {
  Controller,
  Param,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiDetailTransformInterceptor } from '../app.interceptors';
import { RequireOrganizationPermission } from '../auth/auth.decorators';

@Controller('properties/:propertyId/workflow')
@ApiTags('Properties', 'Property Workflow')
export class PropertyStatusHistoryController {
  constructor(private propertyService: HivePropertyServiceClient) {}

  @Post('/request-review')
  @RequireOrganizationPermission({ property: ['update'] })
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Submit draft property for review' })
  @ApiCreatedResponse({ type: GetStatusHistoryEntryResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  requestReview(
    @Param('propertyId') propertyId: string,
    @Query() query: CustomRepresentationQueryDto,
  ) {}
  @Post('/approve')
  @RequireOrganizationPermission({ property: ['update'] })
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Approve pending property' })
  @ApiCreatedResponse({ type: GetStatusHistoryEntryResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  approve(
    @Param('propertyId') propertyId: string,
    @Query() query: CustomRepresentationQueryDto,
  ) {}
}
