import {
  IDENTITY_HTTP_SERVER_CONFIG_TOKEN,
  IDENTITY_RPC_SERVER_CONFIG_TOKEN,
  IdentityHTTPServerConfigProvider,
  IdentityRPCServerConfigProvider,
} from '@hive/identity';
import { RegistryClientConfig, RegistryClientModule } from '@hive/registry';
import { ServerConfig } from '@hive/utils';
import { ConfigifyModule } from '@itgorillaz/configify';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigifyModule.forRootAsync({ configFilePath: ['.env', 'package.json'] }),
    ScheduleModule.forRoot(),
    RegistryClientModule.registerForService({
      useFactory: (config: RegistryClientConfig, http: ServerConfig) => {
        if (!config) {
          throw new Error('RegistryClientConfig is required');
        }
        if (!http) {
          throw new Error('ServerConfig is required');
        }

        return {
          service: {
            host: http.host,
            port: http.port,
            metadata: { ...(config.metadata || {}), protocol: 'HTTP' },
            name: config.serviceName,
            version: config.serviceVersion,
            tags: [...(config.tags || []), 'HTTP'],
          },
        };
      },
      inject: [RegistryClientConfig, IDENTITY_HTTP_SERVER_CONFIG_TOKEN],
      providers: [IdentityHTTPServerConfigProvider],
    }),
    RegistryClientModule.registerForService({
      useFactory: (config: RegistryClientConfig, grpc: ServerConfig) => {
        if (!config) {
          throw new Error('RegistryClientConfig is required');
        }
        if (!grpc) {
          throw new Error('ServerConfig is required');
        }

        return {
          service: {
            host: grpc.host,
            port: grpc.port,
            metadata: { ...(config.metadata || {}), protocol: 'GRPC' },
            name: config.serviceName,
            version: config.serviceVersion,
            tags: [...(config.tags || []), 'GRPC'],
          },
        };
      },
      inject: [RegistryClientConfig, IDENTITY_RPC_SERVER_CONFIG_TOKEN],
      providers: [IdentityRPCServerConfigProvider],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
