import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MemoryStorage, ServiceInfo, StorageAdapter } from '@hive/registry';
import { RegisterServiceDto, ServiceRegistryEntry } from '@hive/registry';
import { HeartbeatDto, ServiceQueryDto } from '@hive/registry';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ServiceRegistryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ServiceRegistryService.name);

  constructor(private readonly storage: MemoryStorage) {}

  async onModuleInit() {
    await this.storage.initialize();
    this.logger.log('Registry service initialized');
  }

  async onModuleDestroy() {
    await this.storage.close();
    this.logger.log('Registry service destroyed');
  }

  async register(
    registerDto: RegisterServiceDto,
  ): Promise<ServiceRegistryEntry> {
    // Generate instanceId if not provided by client
    const instanceId =
      registerDto.instanceId || this.generateInstanceId(registerDto);

    const serviceInfo: ServiceInfo = {
      ...registerDto,
      instanceId,
      timestamp: Date.now(),
    };

    // Check if instance already exists and handle accordingly
    const existingInstance = await this.storage.findByInstanceId(instanceId);
    if (existingInstance && !registerDto.instanceId) {
      // If server generated the ID and it somehow exists, generate a new one
      serviceInfo.instanceId = this.generateInstanceId(registerDto);
      this.logger.warn(
        `Instance ID collision detected, generated new ID: ${serviceInfo.instanceId}`,
      );
    }

    return this.storage.register(serviceInfo);
  }

  /**
   * Generate a unique instance ID
   */
  private generateInstanceId(serviceInfo: Partial<ServiceInfo>): string {
    const servicePart =
      serviceInfo.name?.replace('@', '').replace('/', '-') || 'unknown';
    const hostPart =
      serviceInfo.host?.replace(/[^a-zA-Z0-9]/g, '-') || 'unknown';
    const portPart = serviceInfo.port || 'unknown';
    const uuid = uuidv4().split('-')[0]; // Short UUID
    const timestamp = Date.now().toString(36); // Base36 timestamp

    return `${servicePart}-${hostPart}-${portPart}-${timestamp}-${uuid}`;
  }

  async deregister(instanceId: string): Promise<boolean> {
    return this.storage.deregister(instanceId);
  }

  async findServices(query: ServiceQueryDto): Promise<ServiceRegistryEntry[]> {
    if (query.instanceId) {
      const service = await this.storage.findByInstanceId(query.instanceId);
      return service ? [service] : [];
    }

    if (query.name) {
      return this.storage.findByName(query.name);
    }

    return this.storage.findAll();
  }

  async heartbeat(instanceId: string): Promise<boolean> {
    return this.storage.heartbeat(instanceId);
  }

  async getHealth() {
    const isHealthy = await this.storage.healthCheck();
    return {
      status: isHealthy ? 'ok' : 'error',
      timestamp: Date.now(),
      uptime: process.uptime(),
      storage: {
        type: this.storage.constructor.name,
        healthy: isHealthy,
      },
    };
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async cleanupExpiredServices() {
    try {
      const cleaned = await this.storage.cleanup();
      if (cleaned > 0) {
        this.logger.log(`Cleaned up ${cleaned} expired services`);
      }
    } catch (error) {
      this.logger.error(`Cleanup failed: ${error.message}`);
    }
  }
}
