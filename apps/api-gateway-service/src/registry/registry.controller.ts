import {
  GetServiceDto,
  ListServicesDto,
  RegisterServiceDto,
  REGISTRY_PACKAGE,
  RegistryClient,
  SendHeartbeatDto,
  RegistryController as IRegistryController,
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

@Controller('registry')
export class RegistryController implements OnModuleInit {
  private registryService: RegistryClient;
  constructor(
    @Inject(REGISTRY_PACKAGE.V1.TOKEN) private client: ClientGrpcProxy,
  ) {}
  onModuleInit() {
    this.registryService = this.client.getService<RegistryClient>('Registry');
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a service instance' })
  @ApiResponse({ status: 201, description: 'Service registered successfully' })
  registerService(@Body() registerDto: RegisterServiceDto) {
    return this.registryService.registerService({
      ...registerDto,
      metadata: registerDto.metadata ?? {},
    });
  }

  @Delete('deregister/:instanceId')
  @ApiOperation({ summary: 'Deregister a service instance' })
  @ApiResponse({
    status: 200,
    description: 'Service deregistered successfully',
  })
  async unregisterService(@Param('instanceId') instanceId: string) {
    const success = await this.registryService.unregisterService({
      id: instanceId,
    });
    return {
      message: `Service ${instanceId} deregistered successfully`,
      success,
    };
  }

  @Get('services')
  @ApiOperation({ summary: 'Discover services' })
  @ApiResponse({ status: 200, description: 'Services retrieved successfully' })
  async listServices(@Query() query: ListServicesDto) {
    // TODO: for query, params are optional but grpc generated types the fields aint optional, take alook
    const results: any = await this.registryService.listServices(query as any);
    return results;
  }

  @ApiOperation({
    summary: 'Find and load balance a service by name and version',
  })
  @Get('services/find')
  async getService(@Query() query: GetServiceDto) {
    const service = await this.registryService.getService(query);
    if (!service)
      throw new NotFoundException({ detail: 'No matching service found' });
    return service;
  }

  @Post('heartbeat')
  @ApiOperation({ summary: 'Send service heartbeat' })
  @ApiResponse({ status: 200, description: 'Heartbeat received successfully' })
  async sendHeartbeat(@Body() heartbeatDto: SendHeartbeatDto) {
    const success = await this.registryService.sendHeartbeat(heartbeatDto);
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
  healthCheck() {
    return this.registryService.healthCheck({});
  }
}
