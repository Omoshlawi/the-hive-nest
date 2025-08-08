import { HeartbeatDto, ServiceQueryDto } from '@hive/registry';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ServiceRegistryService } from './service-registry.service';
import { ZodValidationExceptionFilter } from 'src/app.utils';
@Controller('registry')
export class ServiceRegistryController {
  constructor(private service: ServiceRegistryService) {}

  @Get('services')
  @ApiOperation({ summary: 'Discover services' })
  @ApiResponse({ status: 200, description: 'Services retrieved successfully' })
  async findServices(@Query() query: ServiceQueryDto) {
    return query;
  }

  @Post('heartbeat')
  @ApiOperation({ summary: 'Send service heartbeat' })
  @ApiResponse({ status: 200, description: 'Heartbeat received successfully' })
  async heartbeat(@Body() heartbeatDto: HeartbeatDto) {
    return heartbeatDto;
  }

  @Get('health')
  @ApiOperation({ summary: 'Get registry health status' })
  @ApiResponse({
    status: 200,
    description: 'Health status retrieved successfully',
  })
  async getHealth() {
    return 'Get Health';
  }

  @Delete('deregister/:instanceId')
  @ApiOperation({ summary: 'Deregister a service instance' })
  @ApiResponse({
    status: 200,
    description: 'Service deregistered successfully',
  })
  async deregister(@Param('instanceId') instanceId: string) {
    return 'Deregester';
  }
}
