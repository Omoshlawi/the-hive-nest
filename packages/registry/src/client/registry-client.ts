import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  RegistryClient,
  RegistryClientOptions,
} from '../interfaces/registry-client.interface';
import {
  ServiceInfo,
  ServiceRegistryEntry,
} from '../interfaces/service-info.interface';
import { RegisterServiceDto, HeartbeatDto } from '../dto';

@Injectable()
export class RegistryClientService implements RegistryClient {
  private readonly logger = new Logger(RegistryClientService.name);
  private heartbeatTimer?: NodeJS.Timeout;
  private currentService?: ServiceRegistryEntry;

  constructor(
    private readonly httpService: HttpService,
    private readonly options: RegistryClientOptions,
  ) {}

  async register(
    serviceInfo: Omit<ServiceInfo, 'timestamp' | 'instanceId'> & {
      instanceId?: string;
    },
  ): Promise<ServiceRegistryEntry> {
    try {
      const registerDto: RegisterServiceDto = {
        ...(serviceInfo as any),
        ttl: serviceInfo.ttl || 300, // Default 5 minutes
        // instanceId is optional - server will generate if not provided
      };

      const response = await firstValueFrom(
        this.httpService.post<{ data: ServiceRegistryEntry }>(
          `${this.options.registryUrl}/registry/register`,
          registerDto,
          { timeout: this.options.timeout || 5000 },
        ),
      );

      this.currentService = response.data.data;
      this.logger.log(
        `Service registered: ${serviceInfo.name} (${this.currentService?.instanceId})`,
      );

      if (this.options.heartbeatInterval) {
        this.startHeartbeat();
      }

      return this.currentService;
    } catch (error) {
      this.logger.error(`Failed to register service: ${error.message}`);
      throw error;
    }
  }

  async deregister(): Promise<boolean> {
    if (!this.currentService) {
      return false;
    }

    try {
      this.stopHeartbeat();

      await firstValueFrom(
        this.httpService.delete(
          `${this.options.registryUrl}/registry/deregister/${this.currentService.instanceId}`,
          { timeout: this.options.timeout || 5000 },
        ),
      );

      this.logger.log(
        `Service deregistered: ${this.currentService.instanceId}`,
      );
      this.currentService = undefined;
      return true;
    } catch (error) {
      this.logger.error(`Failed to deregister service: ${error.message}`);
      return false;
    }
  }

  async discover(serviceName: string): Promise<ServiceRegistryEntry[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<{ data: ServiceRegistryEntry[] }>(
          `${this.options.registryUrl}/registry/services`,
          {
            params: { name: serviceName },
            timeout: this.options.timeout || 5000,
          },
        ),
      );

      return response.data.data;
    } catch (error) {
      this.logger.error(`Failed to discover services: ${error.message}`);
      throw error;
    }
  }

  startHeartbeat(): void {
    if (!this.currentService || this.heartbeatTimer) {
      return;
    }

    const interval = this.options.heartbeatInterval || 60000; // Default 1 minute

    this.heartbeatTimer = setInterval(async () => {
      try {
        const heartbeatDto: HeartbeatDto = {
          instanceId: this.currentService!.instanceId,
        };

        await firstValueFrom(
          this.httpService.post(
            `${this.options.registryUrl}/registry/heartbeat`,
            heartbeatDto,
            { timeout: this.options.timeout || 5000 },
          ),
        );

        this.logger.debug(
          `Heartbeat sent for instance: ${this.currentService!.instanceId}`,
        );
      } catch (error) {
        this.logger.warn(`Heartbeat failed: ${error.message}`);
      }
    }, interval);

    this.logger.log(`Heartbeat started with interval: ${interval}ms`);
  }

  stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
      this.logger.log('Heartbeat stopped');
    }
  }

  async getHealth(): Promise<boolean> {
    try {
      await firstValueFrom(
        this.httpService.get(`${this.options.registryUrl}/health`, {
          timeout: this.options.timeout || 5000,
        }),
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  async onModuleDestroy() {
    await this.deregister();
  }
}
