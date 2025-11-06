import {
  Endpoint,
  HiveServiceModule,
  RegistryClientConfig,
} from '@hive/registry';
import { ServerConfig } from '@hive/utils';
import { ConfigifyModule } from '@itgorillaz/configify';
import { Module } from '@nestjs/common';
import { TourController } from './app.controller';
import { TourService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { QueryBuilderModule } from '@hive/common';
import { HiveFileServiceClient } from '@hive/files';
import {
  VIRTUAL_TOUR_HTTP_SERVER_CONFIG_TOKEN,
  VIRTUAL_TOUR_RPC_SERVER_CONFIG_TOKEN,
  VirtualTourHTTPServerConfigProvider,
  VirtualTourRPCServerConfigProvider,
} from '@hive/virtual-tour';
import { TourSceneModule } from './tour-scene/tour-scene.module';
import { TileGeneratorService } from './tile-generator.service';

@Module({
  imports: [
    ConfigifyModule.forRootAsync({ configFilePath: ['.env', 'package.json'] }),
    ScheduleModule.forRoot(),
    HiveServiceModule.forRoot({
      global: true,
      enableHeartbeat: true,
      services: [HiveFileServiceClient],
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
          VIRTUAL_TOUR_HTTP_SERVER_CONFIG_TOKEN,
          VIRTUAL_TOUR_RPC_SERVER_CONFIG_TOKEN,
        ],
        providers: [
          VirtualTourHTTPServerConfigProvider,
          VirtualTourRPCServerConfigProvider,
        ],
      },
    }),
    PrismaModule,
    QueryBuilderModule.register({ global: true }),
    TourSceneModule,
  ],
  controllers: [TourController],
  providers: [TourService, TileGeneratorService],
})
export class TourModule {}
