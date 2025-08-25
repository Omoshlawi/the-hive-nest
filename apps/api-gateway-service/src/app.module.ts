import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigifyModule } from '@itgorillaz/configify';
import { RegistryModule } from './registry/registry.module';
import {
  GlobalRpcExceptionInterceptor,
  GlobalZodExceptionFilter,
  GlobalZodValidationPipe,
} from '@hive/common';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './lib/auth';
import {
  Endpoint,
  RegistryClientConfig,
  RegistryClientModule,
} from '@hive/registry';
import { ServerConfig } from '@hive/utils';
import {
  IDENTITY_RPC_SERVER_CONFIG_TOKEN,
  HIVE_IDENTITY_SERVICE_NAME,
  IdentityRPCServerConfigProvider,
} from '@hive/identity';

@Module({
  imports: [
    ConfigifyModule.forRootAsync(),
    AuthModule.forRoot(auth),
    // For direct communication with registry on registry endpoints
    RegistryModule,
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
