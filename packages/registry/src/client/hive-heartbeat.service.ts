import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { catchError, delay, firstValueFrom, of, retry, timeout } from 'rxjs';
import { CLIENT_SERVICE_CONFIG_TOKEN } from '../constants';
import { ClientServiceConfig } from '../interfaces';
import { ServiceRegistration } from '../types';
import { HiveDiscoveryService } from './hive-discovery.service';

@Injectable()
export class HiveHeartbeatService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(HiveHeartbeatService.name);
  private serviceInstance: ServiceRegistration | null = null;
  private registrationAttempts = 0;
  private readonly MAX_REGISTRATION_ATTEMPTS = 5;
  private readonly REGISTRATION_TIMEOUT = 10000; // 10 seconds
  private readonly HEARTBEAT_TIMEOUT = 5000; // 5 seconds
  private isShuttingDown = false;

  constructor(
    private readonly discoveryService: HiveDiscoveryService,
    @Inject(CLIENT_SERVICE_CONFIG_TOKEN)
    private readonly config: ClientServiceConfig,
  ) {}

  async onModuleInit() {
    this.logger.log(
      `Initializing ${HiveHeartbeatService.name} for: ${this.config.service.name}@${this.config.service.version}`,
    );

    await this.registerWithRetry();
  }

  async onModuleDestroy() {
    this.logger.log('Shutting down Heartbeat Service...');
    this.isShuttingDown = true;

    if (this.serviceInstance) {
      try {
        await this.unregisterService();
        this.logger.log('Successfully unregistered from registry');
      } catch (error) {
        this.logger.error('Failed to unregister from registry', error);
      }
    }
  }

  private async registerWithRetry(): Promise<void> {
    while (
      this.registrationAttempts < this.MAX_REGISTRATION_ATTEMPTS &&
      !this.serviceInstance &&
      !this.isShuttingDown
    ) {
      this.registrationAttempts++;

      try {
        this.logger.log(
          `Registration attempt ${this.registrationAttempts}/${this.MAX_REGISTRATION_ATTEMPTS}`,
        );

        const registryService = this.discoveryService.getRegistryService();
        this.serviceInstance = await firstValueFrom(
          registryService.registerService(this.config.service).pipe(
            timeout(this.REGISTRATION_TIMEOUT),
            retry({
              count: 2,
              delay: (error, retryCount) => {
                this.logger.warn(
                  `Registration retry ${retryCount}/2 after error:`,
                  error.message,
                );
                return of(null).pipe(delay(1000 * retryCount)); // Exponential backoff
              },
            }),
            catchError((error) => {
              this.logger.error(
                `Registration attempt ${this.registrationAttempts} failed:`,
                error.message,
              );
              throw error;
            }),
          ),
        );

        if (this.serviceInstance) {
          this.logger.log(
            `Successfully registered service with ID: ${this.serviceInstance.id}`,
          );
          this.registrationAttempts = 0; // Reset for future re-registrations
          return;
        }
      } catch (error) {
        this.logger.error(
          `Registration attempt ${this.registrationAttempts} failed:`,
          error.message,
        );

        if (this.registrationAttempts < this.MAX_REGISTRATION_ATTEMPTS) {
          const waitTime = Math.min(
            1000 * Math.pow(2, this.registrationAttempts - 1),
            30000,
          ); // Exponential backoff, max 30s
          this.logger.warn(`Retrying registration in ${waitTime}ms...`);
          await this.sleep(waitTime);
        }
      }
    }

    if (!this.serviceInstance && !this.isShuttingDown) {
      this.logger.error(
        `Failed to register after ${this.MAX_REGISTRATION_ATTEMPTS} attempts. Service will continue without registry.`,
      );
    }
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async sendHeartbeat() {
    if (this.isShuttingDown) {
      return;
    }

    if (!this.serviceInstance) {
      this.logger.warn(
        'No service registration found. Attempting to re-register...',
      );
      await this.registerWithRetry();
      return;
    }

    try {
      this.logger.debug(
        `Sending heartbeat for service ID: ${this.serviceInstance.id}`,
      );

      const registryService = this.discoveryService.getRegistryService();
      await firstValueFrom(
        registryService
          .heartbeat({
            serviceId: this.serviceInstance.id,
            endpoints:
              this.serviceInstance.endpoints ??
              this.config.service.endpoints ??
              [],
            metadata: this.serviceInstance.metadata, // TODO, Get health info and update, this include uptime, resource usage, e.t.c
            tags: this.serviceInstance.tags,
          })
          .pipe(
            timeout(this.HEARTBEAT_TIMEOUT),
            catchError((error) => {
              this.logger.error('Heartbeat failed:', error.message);
              // If heartbeat fails, the service might be unregistered

              if (
                error.code === 'NOT_FOUND' ||
                error.message.includes('not found')
              ) {
                this.logger.warn(
                  'Service not found in registry. Will attempt re-registration on next heartbeat.',
                );
                this.serviceInstance = null;
              }

              return of(null);
            }),
          ),
      );

      this.logger.debug('Heartbeat sent successfully');
    } catch (error) {
      this.logger.error('Heartbeat error:', error);

      // Consider the service unregistered if heartbeat consistently fails
      if (error.code === 'UNAVAILABLE' || error.code === 'DEADLINE_EXCEEDED') {
        this.logger.warn(
          'Registry service appears unavailable. Will retry registration on next heartbeat.',
        );
        this.serviceInstance = null;
      }
    }
  }

  private async unregisterService(): Promise<void> {
    if (!this.serviceInstance) {
      return;
    }

    try {
      const registryService = this.discoveryService.getRegistryService();
      await firstValueFrom(
        registryService
          .unregisterService({
            id: this.serviceInstance.id,
          })
          .pipe(
            timeout(this.REGISTRATION_TIMEOUT),
            catchError((error) => {
              this.logger.warn(
                'Unregistration failed (service might already be removed):',
                error.message,
              );
              return of(null);
            }),
          ),
      );
    } catch (error) {
      this.logger.error('Failed to unregister service:', error);
      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public getServiceInstance(): ServiceRegistration | null {
    return this.serviceInstance;
  }

  public async forceReregister(): Promise<void> {
    this.logger.log('Forcing re-registration...');
    this.serviceInstance = null;
    this.registrationAttempts = 0;
    await this.registerWithRetry();
  }
}
