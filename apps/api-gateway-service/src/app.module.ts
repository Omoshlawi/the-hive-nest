import { AuthorizatioModule, AuthorizationConfig } from '@hive/authorization';
import {
  BridgeModule,
  GlobalRpcExceptionInterceptor,
  GlobalZodExceptionFilter,
  GlobalZodValidationPipe,
} from '@hive/common';
import {
  HIVE_IDENTITY_SERVICE_NAME,
  IDENTITY_RPC_SERVER_CONFIG_TOKEN,
  IdentityRPCServerConfigProvider,
} from '@hive/identity';
import {
  Endpoint,
  HiveServiceModule,
  RegistryClientConfig,
} from '@hive/registry';
import { ServerConfig } from '@hive/utils';
import { ConfigifyModule } from '@itgorillaz/configify';
import {
  AFTER_HOOK_KEY,
  AuthModule as AuthenticationModule,
  BEFORE_HOOK_KEY,
  HOOK_KEY,
} from '@mguay/nestjs-better-auth';
import { Module } from '@nestjs/common';
import {
  DiscoveryModule,
  DiscoveryService,
  MetadataScanner,
  Reflector,
} from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import {
  admin,
  anonymous,
  apiKey,
  bearer,
  createAuthMiddleware,
  jwt,
  multiSession,
  openAPI,
  organization,
  username,
} from 'better-auth/plugins';
import { AmenitiesModule } from './amenities/amenities.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AttributeTypesModule } from './attribute-types/attribute-types.module';
import { CategoriesModule } from './categories/categories.module';
import { FilesModule } from './files/files.module';
import { SignUpHook } from './hooks/sign-up-hook.service';
import { IdentityModule } from './identity/identity.module';
import { PrismaModule } from './prisma/prisma.module';
import { PrismaService } from './prisma/prisma.service';
import { RegistryModule } from './registry/registry.module';
import { RelationshipTypesModule } from './relationship-types/relationship-types.module';

const HOOKS = [
  { metadataKey: BEFORE_HOOK_KEY, hookType: 'before' as const },
  { metadataKey: AFTER_HOOK_KEY, hookType: 'after' as const },
];

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
        BridgeModule.for({
          providers: [SignUpHook],
          imports: [DiscoveryModule],
        }),
      ],
      useFactory(
        prisma: PrismaService,
        discover: DiscoveryService,
        reflector: Reflector,
        metadataScanner: MetadataScanner,
      ) {
        const providers = discover
          .getProviders()
          .filter(
            ({ metatype }) => metatype && reflector.get(HOOK_KEY, metatype),
          );
        const hooks = {};

        for (const provider of providers) {
          const providerPrototype = Object.getPrototypeOf(provider.instance);
          const methods = metadataScanner.getAllMethodNames(providerPrototype);
          for (const method of methods) {
            const providerMethod = providerPrototype[method];
            for (const { metadataKey, hookType } of HOOKS) {
              const hookPath = reflector.get(metadataKey, providerMethod);
              if (!hookPath) continue;

              const originalHook = hooks[hookType];
              hooks[hookType] = createAuthMiddleware(async (ctx) => {
                if (originalHook) {
                  await originalHook(ctx);
                }

                if (hookPath === ctx.path) {
                  await providerMethod.apply(provider.instance, [ctx]);
                }
              });
            }
          }
        }

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
            hooks,
          }),
        };
      },
      inject: [PrismaService, DiscoveryService, Reflector, MetadataScanner],
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
