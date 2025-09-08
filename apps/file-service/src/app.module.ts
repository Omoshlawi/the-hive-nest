import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigifyModule } from '@itgorillaz/configify';
import {
  Endpoint,
  HiveServiceModule,
  RegistryClientConfig,
} from '@hive/registry';
import { ServerConfig } from '@hive/utils';
import {
  FILE_HTTP_SERVER_CONFIG_TOKEN,
  FILE_RPC_SERVER_CONFIG_TOKEN,
  FileHTTPServerConfigProvider,
  FileRPCServerConfigProvider,
} from '@hive/files';

@Module({
  imports: [
    ConfigifyModule.forRootAsync({ configFilePath: ['.env', 'package.json'] }),
    HiveServiceModule.forRoot({
      enableHeartbeat: true,
      services: [],
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
          FILE_HTTP_SERVER_CONFIG_TOKEN,
          FILE_RPC_SERVER_CONFIG_TOKEN,
        ],
        providers: [FileHTTPServerConfigProvider, FileRPCServerConfigProvider],
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
