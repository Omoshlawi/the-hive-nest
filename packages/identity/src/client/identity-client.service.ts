import {
  Endpoint,
  RegistryClientService,
  ServiceUpdate_UpdateType,
} from '@hive/registry';
import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  ClientGrpcProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import { IDENTITY_PACKAGE, IDENTITY_SERVICE_CONFIG_TOKEN } from '../constants';
import { ClientServiceConfig } from '../interfaces';
import { IDENTITY_SERVICE_NAME, IdentityClient } from '../types';

/**
 * IdentityClientService manages GRPC connections to identity service instances.
 * It listens to registry updates and maintains a pool of GRPC clients for available identity services.
 */
@Injectable()
export class IdentityClientService implements OnModuleInit, OnModuleDestroy {
  /** Pool of GRPC clients keyed by service instance ID */
  private identityServicesGRPCPool: Map<string, IdentityClient> = new Map();

  /** GRPC proxy client for communication */
  private clientProxy: ClientGrpcProxy;

  /** Logger instance for logging service activity */
  private readonly logger = new Logger(IdentityClientService.name);

  /**
   * Constructs the IdentityClientService.
   * @param registryClient Registry client for service discovery
   * @param config Configuration for the identity client
   */
  constructor(
    private readonly registryClient: RegistryClientService,
    @Inject(IDENTITY_SERVICE_CONFIG_TOKEN) private config: ClientServiceConfig,
  ) {}

  /**
   * Cleans up GRPC proxy client on module destroy.
   */
  onModuleDestroy() {
    this.logger.log('Closing GRPC proxy client');
    this.clientProxy.close();
  }

  /**
   * Initializes the service, sets up registry stream processing.
   */
  onModuleInit() {
    this.logger.debug('Setting up service stream processing');
    this.streamServices().subscribe((updateStream) => {
      this.logger.debug('Consuming service changes stream');
      const serviceName =
        updateStream.service?.name +
        '@' +
        updateStream.service?.version +
        '(' +
        updateStream.service?.id +
        ')';
      const serviceid = updateStream.service?.id;

      // Only process relevant identity services with grpc tag
      if (
        this.config.service.name === updateStream.service?.name &&
        updateStream.service?.tags.includes('grpc') &&
        serviceid
      ) {
        this.logger.debug(`Processing service ${serviceName}`);

        // Handle service removal
        if (updateStream.type === ServiceUpdate_UpdateType.REMOVED) {
          this.identityServicesGRPCPool.delete(serviceid);
          this.logger.log(
            `Service instance [${serviceName}] removed: connection cleared`,
          );
        }

        // Skip if connection already exists
        if (this.identityServicesGRPCPool.has(serviceid)) {
          this.logger.debug(
            `Service connection for [${serviceName}] already exists, skipping`,
          );
        } else {
          this.logger.debug(
            `Service connection for [${serviceName}] not found, creating and caching`,
          );
          const endpoint = updateStream.service!.endpoints!.find(
            (end) => end.protocol === 'grpc',
          );
          if (!endpoint) {
            this.logger.warn(
              `No GRPC endpoint found for service [${serviceName}]`,
            );
            return;
          }
          const newClientProxy =
            this.createGrpcProxyClientForEndpoint(endpoint);
          const identityService = newClientProxy.getService<IdentityClient>(
            IDENTITY_SERVICE_NAME,
          );
          this.identityServicesGRPCPool.set(serviceid, identityService);
          this.logger.log(
            `New Identity client instance for [${serviceName}] established and cached`,
          );
        }
      } else {
        this.logger.debug(`Skipping processing service ${serviceName}`);
      }
    });
  }

  /**
   * Streams service updates from the registry.
   * @returns Observable of service update streams
   */
  private streamServices() {
    const service = this.registryClient.getRegistrycService();
    return service.watchServices({});
  }

  /**
   * Creates a GRPC proxy client for the given endpoint.
   * @param endpoint Service endpoint information
   * @returns GRPC proxy client
   */
  private createGrpcProxyClientForEndpoint(endpoint: Endpoint) {
    this.logger.debug(
      `Creating GRPC proxy client for endpoint ${endpoint.host}:${endpoint.port}`,
    );
    return ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: IDENTITY_PACKAGE.V1.NAME,
        protoPath: IDENTITY_PACKAGE.V1.PROTO_PATH,
        url: `${endpoint.host}:${endpoint.port}`,
      },
    });
  }
}
