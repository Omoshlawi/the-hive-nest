/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ApiErrorsResponse,
  CustomRepresentationQueryDto,
  DeleteQueryDto,
} from '@hive/common';
import {
  CreatePropertyMediaDto,
  GetPropertyMediaResponseDto,
  HivePropertyServiceClient,
  QueryPropertyMediaDto,
  QueryPropertyMediaResponseDto,
  UpdatePropertyMediaDto,
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
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiDetailTransformInterceptor,
  ApiListTransformInterceptor,
} from '../app.interceptors';

@Controller('properties/:propertyId/media')
@ApiTags('Properties', 'Property Media')
export class PropertyMediaController {
  constructor(private propertyService: HivePropertyServiceClient) {}

  @Get('/')
  @UseInterceptors(ApiListTransformInterceptor)
  @ApiOperation({ summary: 'Query PropertyMedia' })
  @ApiOkResponse({ type: QueryPropertyMediaResponseDto })
  @ApiErrorsResponse()
  queryPropertyMedia(
    @Query() query: QueryPropertyMediaDto,
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
  ) {
    return this.propertyService.propertyMedia.queryPropertyMedia({
      queryBuilder: {
        limit: query.limit,
        orderBy: query.orderBy,
        page: query.page,
        v: query.v,
      },
      includeVoided: query.includeVoided,
      search: query.search,
      propertyId: propertyId,
      size: query.size,
      type: query.type,
      memeType: query.memeType,
      context: {

      }
    });
  }

  @Post('/')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Create PropertyMedia' })
  @ApiCreatedResponse({ type: GetPropertyMediaResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  createPropertyMedia(
    @Body() createPropertyMediaDto: CreatePropertyMediaDto,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.propertyService.propertyMedia.createPropertyMedia({
      queryBuilder: {
        v: query.v,
      },
      ...createPropertyMediaDto,
      
    });
  }

  @Get('/:id')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Get PropertyMedia' })
  @ApiOkResponse({ type: GetPropertyMediaResponseDto })
  @ApiErrorsResponse()
  getPropertyMedia(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.propertyService.propertyMedia.getPropertyMedia({
      id,
      queryBuilder: query,
    });
  }

  @Patch('/:id')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Update PropertyMedia' })
  @ApiOkResponse({ type: GetPropertyMediaResponseDto })
  @ApiErrorsResponse({ badRequest: true })
  updatePropertyMedia(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePropertyMediaDto: UpdatePropertyMediaDto,
    @Query() query: CustomRepresentationQueryDto,
  ) {
    return this.propertyService.propertyMedia.updatePropertyMedia({
      id,
      queryBuilder: { v: query?.v },
      ...updatePropertyMediaDto,
    });
  }

  @Delete('/:id')
  @UseInterceptors(ApiDetailTransformInterceptor)
  @ApiOperation({ summary: 'Delete PropertyMedia' })
  @ApiOkResponse({ type: GetPropertyMediaResponseDto })
  @ApiErrorsResponse()
  deletePropertyMedia(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: DeleteQueryDto,
  ) {
    return this.propertyService.propertyMedia.deletePropertyMedia({
      id,
      queryBuilder: { v: query.v },
      purge: query.purge,
    });
  }
}
