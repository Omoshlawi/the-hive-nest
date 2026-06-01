import { Module } from '@nestjs/common';
import { ConfigifyModule } from '@itgorillaz/configify';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule, QueryBuilderModule } from '@hive/common';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  Endpoint,
  HiveServiceModule,
  RegistryClientConfig,
} from '@hive/registry';
import { ServerConfig } from '@hive/utils';
import {
  TEMPLATE_HTTP_SERVER_CONFIG_TOKEN,
  TEMPLATE_RPC_SERVER_CONFIG_TOKEN,
  TemplateHTTPServerConfigProvider,
  TemplateRPCServerConfigProvider,
} from '@hive/template';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { PrismaConfig } from './prisma/prisma.config';
import { TemplatesModule } from './templates/templates.module';

@Module({
  imports: [
    ConfigifyModule.forRootAsync({ configFilePath: ['.env', 'package.json'] }),
    ScheduleModule.forRoot(),
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
              ].filter(Boolean) as Array<string>,
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
          TEMPLATE_HTTP_SERVER_CONFIG_TOKEN,
          TEMPLATE_RPC_SERVER_CONFIG_TOKEN,
        ],
        providers: [
          TemplateHTTPServerConfigProvider,
          TemplateRPCServerConfigProvider,
        ],
      },
    }),
    PrismaModule.forRootAsync({
      global: true,
      service: PrismaService,
      inject: [PrismaConfig],
      useFactory: (config: PrismaConfig) => ({
        adapter: new PrismaPg({ connectionString: config.databaseUrl }),
      }),
    }),
    QueryBuilderModule.register({ global: true }),
    TemplatesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
