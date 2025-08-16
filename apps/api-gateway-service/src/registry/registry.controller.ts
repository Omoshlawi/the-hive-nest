import {
  QueryServicesDto,
  RegisterServiceDto,
  REGISTRY_PACKAGE,
  REGISTRY_SERVICE_NAME,
  RegistryClient,
  SendHeartbeatDto,
} from '@hive/registry';
import { unflattenArray } from '@hive/utils';
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  OnModuleInit,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ClientGrpcProxy } from '@nestjs/microservices';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { map } from 'rxjs';

@Controller('registry')
export class RegistryController implements OnModuleInit {
  private registryService: RegistryClient;
  constructor(
    @Inject(REGISTRY_PACKAGE.V1.TOKEN) private client: ClientGrpcProxy,
  ) {}
  onModuleInit() {
    this.registryService = this.client.getService<RegistryClient>(
      REGISTRY_SERVICE_NAME,
    );
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a service instance' })
  @ApiResponse({ status: 201, description: 'Service registered successfully' })
  registerService(@Body() registerDto: RegisterServiceDto) {
    return 'registerDto';
    return this.registryService.registerService({
      ...registerDto,
      metadata: registerDto.metadata ?? {},
    });
  }

  @Delete('deregister/:instanceId')
  @ApiOperation({ summary: 'Deregister a service instance' })
  @ApiResponse({
    status: 200,
  })
  unregisterService(@Param('instanceId') instanceId: string) {
    return this.registryService.unregisterService({
      id: instanceId,
    });
  }

  @Get('services')
  @ApiOperation({ summary: 'Discover services' })
  @ApiResponse({ status: 200, description: 'Services retrieved successfully' })
  listServices(@Query() query: QueryServicesDto) {
    return this.registryService
      .listServices({
        ...query,
        metadata: unflattenArray(query.metadata?.split(',') ?? []),
        tags: query.tags?.split(',') ?? [],
      })
      .pipe(
        map((services) => ({
          results: services?.services ?? [],
        })),
      );
  }

  @ApiOperation({
    summary: 'Find and load balance a service by name and version',
  })
  @Get('services/find')
  getService(@Query() query: QueryServicesDto) {
    return this.registryService.getService({
      ...query,
      metadata: unflattenArray(query.metadata?.split(',') ?? []),
      tags: query.tags?.split(',') ?? [],
    });
  }

  @Post('heartbeat')
  @ApiOperation({ summary: 'Send service heartbeat' })
  @ApiResponse({ status: 200, description: 'Heartbeat received successfully' })
  heartbeat(@Body() heartbeatDto: SendHeartbeatDto) {
    return this.registryService.heartbeat(heartbeatDto);
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
