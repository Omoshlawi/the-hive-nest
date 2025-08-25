import {
  GlobalRpcExceptionInterceptor,
  GlobalZodExceptionFilter,
  GlobalZodValidationPipe,
} from '@hive/common';
import {
  HIVE_IDENTITY_SERVICE_NAME,
  IDENTITY_RPC_SERVER_CONFIG_TOKEN,
  IdentityRPCServerConfigProvider,
} from '@hive/identity';
import {
  Endpoint,
  RegistryClientConfig,
  RegistryClientModule,
} from '@hive/registry';
import { ServerConfig } from '@hive/utils';
import { ConfigifyModule } from '@itgorillaz/configify';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { IdentityModule } from './identity/identity.module';
import { auth } from './lib/auth';
import { RegistryModule } from './registry/registry.module';

@Module({
  imports: [
    ConfigifyModule.forRootAsync(),
    AuthModule.forRoot(auth),
    // For direct communication with registry on registry endpoints
    RegistryModule,
    // TODO: Document registry package indicating importance of schedule module and config to enebale client module to work well
    ScheduleModule.forRoot(),
    // For identity service discovery on registry service
    RegistryClientModule.registerForService({
      isGlobal: true,
      useFactory: (config: RegistryClientConfig, grpc: ServerConfig) => {
        if (!config) {
          throw new Error('RegistryClientConfig is required');
        }
        return {
          service: {
            metadata: config.metadata ?? {},
            name: HIVE_IDENTITY_SERVICE_NAME,
            version: config.serviceVersion,
            tags: [grpc ? 'grpc' : undefined].filter(Boolean) as Array<string>, // Tag the server used in service
            endpoints: [
              grpc
                ? {
                    host: grpc.host,
                    port: grpc.port,
                    protocol: 'grpc',
                    metadata: {},
                  }
                : undefined,
            ].filter(Boolean) as Array<Endpoint>,
          },
        };
      },
      inject: [RegistryClientConfig, IDENTITY_RPC_SERVER_CONFIG_TOKEN],
      providers: [IdentityRPCServerConfigProvider],
    }),
    // Handle RPC calls to identity service (concreate implementation for rpc methods in identity package)
    IdentityModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    GlobalZodValidationPipe,
    GlobalZodExceptionFilter,
    GlobalRpcExceptionInterceptor,
  ],
})
export class AppModule {}
