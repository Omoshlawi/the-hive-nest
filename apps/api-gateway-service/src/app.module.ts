import {
  BridgeModule,
  GlobalRpcExceptionInterceptor,
  GlobalZodExceptionFilter,
  GlobalZodValidationPipe,
} from '@hive/common';
import { ConfigifyModule } from '@itgorillaz/configify';
import { Module } from '@nestjs/common';
import { AmenitiesModule } from './amenities/amenities.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AttributeTypesModule } from './attribute-types/attribute-types.module';
import { CategoriesModule } from './categories/categories.module';
import { IdentityModule } from './identity/identity.module';
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
import { PrismaService } from './prisma/prisma.service';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import {
  admin,
  anonymous,
  apiKey,
  bearer,
  jwt,
  multiSession,
  openAPI,
  organization,
  username,
} from 'better-auth/plugins';
import { betterAuth } from 'better-auth';
import { AuthModule as AuthenticationModule } from '@mguay/nestjs-better-auth';
import { PrismaModule } from './prisma/prisma.module';
import { SignUpHook } from './hooks/sign-up-hook.service';
import { AuthorizatioModule, AuthorizationConfig } from '@hive/authorization';

@Module({
  imports: [
    ConfigifyModule.forRootAsync(),
    ScheduleModule.forRoot(),
    AuthenticationModule.forRootAsync({
      imports: [
        PrismaModule,
        AuthorizatioModule.forRootAsync({
          inject: [AuthorizationConfig],
          useFactory(config: AuthorizationConfig) {
            return {
              storeId: config.fgaStoreId,
              apiUrl: config.fgaApiUrl,
              authorizationModelId: config.fgaModelId,
            };
          },
        }),
        BridgeModule.providers(SignUpHook),
      ],
      useFactory(prisma: PrismaService, signUpHook: SignUpHook) {
        return {
          auth: betterAuth({
            database: prismaAdapter(prisma, {
              provider: 'postgresql',
            }),
            plugins: [
              username(),
              anonymous(),
              admin(),
              apiKey(),
              organization(),
              bearer(),
              multiSession(),
              openAPI(),
              jwt(),
            ],
            emailAndPassword: { enabled: true },
            databaseHooks:{}
          }),
        };
      },
      inject: [PrismaService, SignUpHook],
    }),
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
  exports: [],
})
export class AppModule {}
