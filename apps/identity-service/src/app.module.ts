import {
  PROPERTY_HTTP_SERVER_CONFIG_TOKEN,
  PROPERTY_RPC_SERVER_CONFIG_TOKEN,
  PropertyHTTPServerConfigProvider,
  PropertyRPCServerConfigProvider,
} from '@hive/property';
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
      inject: [RegistryClientConfig, PROPERTY_HTTP_SERVER_CONFIG_TOKEN],
      providers: [PropertyHTTPServerConfigProvider],
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
            tags: [...(config.tags || []), 'gRPC'],
          },
        };
      },
      inject: [RegistryClientConfig, PROPERTY_RPC_SERVER_CONFIG_TOKEN],
      providers: [PropertyRPCServerConfigProvider],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
