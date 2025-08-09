import {
  HealthResponseDto,
  HeartbeatDto,
  RegisterServiceDto,
  ServiceQueryDto,
  ServiceResponseDto,
} from '@hive/registry';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  UsePipes
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ServiceRegistryService } from './service-registry.service';
@Controller('registry')
export class ServiceRegistryController {
  constructor(private registryService: ServiceRegistryService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a service instance' })
  @ApiResponse({ status: 201, description: 'Service registered successfully' })
  async register(
    @Body() registerDto: RegisterServiceDto,
  ): Promise<ServiceResponseDto> {
    const data = await this.registryService.register(registerDto);
    return {
      success: true,
      message: 'Service registered successfully',
      data,
    };
  }

  @Delete('deregister/:instanceId')
  @ApiOperation({ summary: 'Deregister a service instance' })
  @ApiResponse({
    status: 200,
    description: 'Service deregistered successfully',
  })
  async deregister(
    @Param('instanceId') instanceId: string,
  ): Promise<ServiceResponseDto> {
    try {
      const success = await this.registryService.deregister(instanceId);
      if (!success) {
        throw new HttpException(
          'Service instance not found',
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
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
  ): Promise<ServiceResponseDto> {
    try {
      const data = await this.registryService.findServices(query);
      return {
        success: true,
        message: 'Services retrieved successfully',
        data,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve services: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('heartbeat')
  @ApiOperation({ summary: 'Send service heartbeat' })
  @ApiResponse({ status: 200, description: 'Heartbeat received successfully' })
  async heartbeat(
    @Body() heartbeatDto: HeartbeatDto,
  ): Promise<ServiceResponseDto> {
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
        success: true,
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
