import { Endpoint, RegistryClientService } from '@hive/registry';
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
  RpcException,
  Transport,
} from '@nestjs/microservices';
import { throwError } from 'rxjs';
import { IDENTITY_PACKAGE, IDENTITY_SERVICE_CONFIG_TOKEN } from '../constants';
import { ClientServiceConfig } from '../interfaces';
import { IDENTITY_SERVICE_NAME, IdentityClient } from '../types';
@Injectable()
export class IdentityClientService implements OnModuleInit, OnModuleDestroy {
  private identityService: IdentityClient;
  private clientProxy: ClientGrpcProxy;
  private readonly logger = new Logger(IdentityClientService.name);
  constructor(
    private readonly registryClient: RegistryClientService,
    @Inject(IDENTITY_SERVICE_CONFIG_TOKEN) private config: ClientServiceConfig,
  ) {}
  onModuleDestroy() {
    this.clientProxy.close();
  }
  onModuleInit() {
    this.queryService().subscribe((service) => {
      const endpoint = service.endpoints.find((end) => end.protocol === 'grpc');
      if (!endpoint)
        return throwError(() => new RpcException('Endpoint not found'));
      this.clientProxy = this.createGrpcProxyClientForEndpoint(endpoint);
      this.identityService = this.clientProxy.getService<IdentityClient>(
        IDENTITY_SERVICE_NAME,
      );
    });
  }

  private queryService() {
    const service = this.registryClient.getRegistrycService();
    return service.getService(this.config.service);
  }

  private createGrpcProxyClientForEndpoint(endpoint: Endpoint) {
    return ClientProxyFactory.create({
      transport: Transport.GRPC,
      options: {
        package: IDENTITY_PACKAGE.V1.NAME,
        protoPath: IDENTITY_PACKAGE.V1.PROTO_PATH,
        url: `${endpoint.host}:${endpoint.port}`,
      },
    });
  }

  public get instance() {
    return this.identityService;
  }
}


// @HiveService({
//   configToken: IDENTITY_SERVICE_CONFIG_TOKEN,

// })
// export class IdentityClient {

// }