import {
  HealthResponseDto,
  HeartbeatDto,
  RegisterServiceDto,
  ServiceByNameandVersionDto,
  ServiceQueryDto,
  ServicesResponseDto,
} from '@hive/registry';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ServiceRegistryService } from './service-registry.service';
@Controller('registry')
export class ServiceRegistryController {
  constructor(private registryService: ServiceRegistryService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a service instance' })
  @ApiResponse({ status: 201, description: 'Service registered successfully' })
  async register(@Body() registerDto: RegisterServiceDto) {
    const data = await this.registryService.register(registerDto);
    return data;
  }

  @Delete('deregister/:instanceId')
  @ApiOperation({ summary: 'Deregister a service instance' })
  @ApiResponse({
    status: 200,
    description: 'Service deregistered successfully',
  })
  async deregister(@Param('instanceId') instanceId: string) {
    try {
      const success = await this.registryService.deregister(instanceId);
      if (!success) {
        throw new HttpException(
          'Service instance not found',
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        message: 'Service deregistered successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;

      throw new HttpException(
        `Failed to deregister service: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('services')
  @ApiOperation({ summary: 'Discover services' })
  @ApiResponse({ status: 200, description: 'Services retrieved successfully' })
  async findServices(
    @Query() query: ServiceQueryDto,
  ): Promise<ServicesResponseDto> {
    try {
      const results = await this.registryService.findServices(query);
      return {
        message: 'Services retrieved successfully',
        results,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve services: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({
    summary: 'Find and load balance a service by name and version',
  })
  @Get('services/find-by-version/load-balance')
  async findByNameAndVersion(@Query() query: ServiceByNameandVersionDto) {
    const service = await this.registryService.findByNameAndVersion(query);
    if (!service)
      throw new NotFoundException({ detail: 'No matching service found' });
    return service;
  }
  @ApiOperation({
    summary: 'Find all services by name and version',
  })
  @Get('services/find-by-version')
  async findAllByNameAndVersion(
    @Query() query: ServiceByNameandVersionDto,
  ): Promise<ServicesResponseDto> {
    const results = await this.registryService.findAllByNameAndVersion(query);
    return {
      message: 'Matching Sercices retrieved successfully',
      results,
    };
  }

  @Post('heartbeat')
  @ApiOperation({ summary: 'Send service heartbeat' })
  @ApiResponse({ status: 200, description: 'Heartbeat received successfully' })
  async heartbeat(@Body() heartbeatDto: HeartbeatDto) {
    try {
      const success = await this.registryService.heartbeat(
        heartbeatDto.instanceId!,
      );
      if (!success) {
        throw new HttpException(
          'Service instance not found',
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        message: 'Heartbeat received successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;

      throw new HttpException(
        `Failed to process heartbeat: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('health')
  @ApiOperation({ summary: 'Get registry health status' })
  @ApiResponse({
    status: 200,
    description: 'Health status retrieved successfully',
  })
  async getHealth(): Promise<HealthResponseDto> {
    return this.registryService.getHealth();
  }
}
