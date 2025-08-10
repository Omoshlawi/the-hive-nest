import {
  HealthResponseDto,
  HeartbeatDto,
  RegisterServiceDto,
  RegistryService,
  SERVICE_REGISTRY_CLIENT,
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
  Inject,
  NotFoundException,
  OnModuleInit,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ClientGrpcProxy } from '@nestjs/microservices';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { from } from 'rxjs';

@Controller('registry')
export class RegistryController implements OnModuleInit {
  private registryService: RegistryService;
  constructor(
    @Inject(SERVICE_REGISTRY_CLIENT) private client: ClientGrpcProxy,
  ) {}
  onModuleInit() {
    this.registryService = this.client.getService<RegistryService>('Registry');
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a service instance' })
  @ApiResponse({ status: 201, description: 'Service registered successfully' })
  register(@Body() registerDto: RegisterServiceDto) {
    return this.registryService.RegisterService({
      ...registerDto,
      timestamp: Date.now(),
      instanceId: '134',
      ttl: registerDto?.ttl ?? 30,
      metadata: {},
    });
  }

  @Delete('deregister/:instanceId')
  @ApiOperation({ summary: 'Deregister a service instance' })
  @ApiResponse({
    status: 200,
    description: 'Service deregistered successfully',
  })
  async deregister(@Param('instanceId') instanceId: string) {
    const success = await this.registryService.UnregisterService({
      instanceId,
    });
    return {
      message: `Service ${instanceId} deregistered successfully`,
      success,
    };
  }

  @Get('services')
  @ApiOperation({ summary: 'Discover services' })
  @ApiResponse({ status: 200, description: 'Services retrieved successfully' })
  async findServices(
    @Query() query: ServiceQueryDto,
  ){
    const results: any = await this.registryService.ListServices(query);
    return results;
  }

  @ApiOperation({
    summary: 'Find and load balance a service by name and version',
  })
  @Get('services/find-by-version/load-balance')
  async findByNameAndVersion(@Query() query: ServiceByNameandVersionDto) {
    const service =
      await this.registryService.GetServiceByNameAndVersion(query);
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
    const results: any =
      await this.registryService.ListServicesByNameAndVersion(query);
    return {
      message: 'Matching Sercices retrieved successfully',
      results,
    };
  }

  @Post('heartbeat')
  @ApiOperation({ summary: 'Send service heartbeat' })
  @ApiResponse({ status: 200, description: 'Heartbeat received successfully' })
  async heartbeat(@Body() heartbeatDto: HeartbeatDto) {
    const success = await this.registryService.SendHeartbeat({
      instanceId: heartbeatDto.instanceId!,
    });
    if (!success) {
      throw new HttpException(
        'Service instance not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      message: 'Heartbeat received successfully',
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Get registry health status' })
  @ApiResponse({
    status: 200,
    description: 'Health status retrieved successfully',
  })
  getHealth(): Promise<HealthResponseDto> {
    return this.registryService.CheckHealth({});
  }
}
