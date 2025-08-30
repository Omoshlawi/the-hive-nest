import {
  PROPERTY_HTTP_SERVER_CONFIG_TOKEN,
  PROPERTY_RPC_SERVER_CONFIG_TOKEN,
  PropertyHTTPServerConfigProvider,
  PropertyRPCServerConfigProvider,
} from '@hive/property';
import {
  Endpoint,
  HiveServiceModule,
  RegistryClientConfig,
  RegistryClientModule,
} from '@hive/registry';
import { ServerConfig } from '@hive/utils';
import { ConfigifyModule } from '@itgorillaz/configify';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { IdentityClientService } from '@hive/identity';

@Module({
  imports: [
    ConfigifyModule.forRootAsync({ configFilePath: ['.env', 'package.json'] }),
    ScheduleModule.forRoot(),
    RegistryClientModule.registerForService({
      isGlobal: true, // Set to true to allow access my module IdentityClientModule which internally uses it.When false then you must import the module in IdentityClientModule
      useFactory: (
        config: RegistryClientConfig,
        http: ServerConfig,
        grpc: ServerConfig,
      ) => {
        if (!config) {
          throw new Error('RegistryClientConfig is required');
        }

        return {
          service: {
            metadata: config.metadata ?? {},
            name: config.serviceName,
            version: config.serviceVersion,
            tags: [http ? 'http' : undefined, grpc ? 'grpc' : undefined].filter(
              Boolean,
            ) as Array<string>, // Tag the server used in service
            endpoints: [
              http
                ? {
                    host: http.host,
                    port: http.port,
                    protocol: 'http',
                    metadata: {},
                  }
                : undefined,
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
      inject: [
        RegistryClientConfig,
        PROPERTY_HTTP_SERVER_CONFIG_TOKEN,
        PROPERTY_RPC_SERVER_CONFIG_TOKEN,
      ],
      providers: [
        PropertyHTTPServerConfigProvider,
        PropertyRPCServerConfigProvider,
      ],
    }),
    HiveServiceModule.forRoot({
      services: [IdentityClientService],
      global: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
