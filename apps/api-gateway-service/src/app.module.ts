import {
  GlobalRpcExceptionInterceptor,
  GlobalZodExceptionFilter,
  GlobalZodValidationPipe,
} from '@hive/common';
import { ConfigifyModule } from '@itgorillaz/configify';
import { Module } from '@nestjs/common';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { AmenitiesModule } from './amenities/amenities.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AttributeTypesModule } from './attribute-types/attribute-types.module';
import { CategoriesModule } from './categories/categories.module';
import { IdentityModule } from './identity/identity.module';
import { auth } from './lib/auth';
import { RegistryModule } from './registry/registry.module';
import { RelationshipTypesModule } from './relationship-types/relationship-types.module';
import { FilesModule } from './files/files.module';
import { ScheduleModule } from '@nestjs/schedule';
import {
  Endpoint,
  HiveServiceModule,
  RegistryClientConfig,
} from '@hive/registry';
import { ServerConfig } from '@hive/utils';
import {
  HIVE_IDENTITY_SERVICE_NAME,
  IDENTITY_RPC_SERVER_CONFIG_TOKEN,
  IdentityRPCServerConfigProvider,
} from '@hive/identity';

@Module({
  imports: [
    ConfigifyModule.forRootAsync(),
    ScheduleModule.forRoot(),
    AuthModule.forRoot(auth),
    // Make Identity service Discoverable
    // Made global for benefit of forFeature In modules only consuming specific services (shares gobal services HiveDiscovery service)
    HiveServiceModule.forRoot({
      global: true,
      services: [],
      enableHeartbeat: true,
      client: {
        useFactory: (config: RegistryClientConfig, grpc: ServerConfig) => {
          if (!config) {
            throw new Error('RegistryClientConfig is required');
          }
          return {
            service: {
              metadata: config.metadata ?? {},
              name: HIVE_IDENTITY_SERVICE_NAME,
              version: config.serviceVersion,
              tags: [grpc ? 'grpc' : undefined].filter(
                Boolean,
              ) as Array<string>, // Tag the server used in service
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
      },
    }),
    // For direct communication with registry on registry endpoints
    RegistryModule,
    // Handle RPC calls to identity service (concreate implementation for rpc methods in identity package)
    IdentityModule,
    AmenitiesModule,
    CategoriesModule,
    AttributeTypesModule,
    RelationshipTypesModule,
    FilesModule,
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
