import { HiveIdentityClientService } from '@hive/identity';
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
} from '@hive/registry';
import { ServerConfig } from '@hive/utils';
import { ConfigifyModule } from '@itgorillaz/configify';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AmenitiesModule } from './amenities/amenities.module';
import { QueryBuilderModule } from '@hive/common';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigifyModule.forRootAsync({ configFilePath: ['.env', 'package.json'] }),
    HiveServiceModule.forRoot({
      enableHeartbeat: true,
      services: [HiveIdentityClientService],
      client: {
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
              tags: [
                http ? 'http' : undefined,
                grpc ? 'grpc' : undefined,
              ].filter(Boolean) as Array<string>, // Tag the server used in service
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
      },
    }),
    AmenitiesModule,
    QueryBuilderModule.register({ global: true }),
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
