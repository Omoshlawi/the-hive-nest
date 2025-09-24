import { AuthorizatioModule, AuthorizationConfig } from '@hive/authorization';
import { GlobalRpcExceptionFilter, QueryBuilderModule } from '@hive/common';
import {
  FILE_HTTP_SERVER_CONFIG_TOKEN,
  FILE_RPC_SERVER_CONFIG_TOKEN,
  FileAuthZService,
  FileHTTPServerConfigProvider,
  FileRPCServerConfigProvider,
} from '@hive/files';
import {
  Endpoint,
  HiveServiceModule,
  RegistryClientConfig,
} from '@hive/registry';
import { ServerConfig } from '@hive/utils';
import { ConfigifyModule } from '@itgorillaz/configify';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FileUsageRuleModule } from './file-usage-rule/file-usage-rule.module';
import { FileUsageScopeModule } from './file-usage-scope/file-usage-scope.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    AuthorizatioModule.forRootAsync({
      global: true,
      inject: [AuthorizationConfig],
      useFactory(config: AuthorizationConfig) {
        return {
          storeId: config.fgaStoreId,
          apiUrl: config.fgaApiUrl,
          authorizationModelId: config.fgaModelId,
        };
      },
    }),
    QueryBuilderModule.register({ global: true }),
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
    PrismaModule,
    FileUsageScopeModule,
    FileUsageRuleModule,
  ],
  controllers: [AppController],
  providers: [AppService, GlobalRpcExceptionFilter, FileAuthZService],
})
export class AppModule {}
