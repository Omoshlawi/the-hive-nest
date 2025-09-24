import {
  AuthorizatioModule,
  AuthorizationConfig,
  OpenFGAService,
} from '@hive/authorization';
import { BridgeModule } from '@hive/common';
import {
  AFTER_HOOK_KEY,
  AuthModule as AuthenticationModule,
  BEFORE_HOOK_KEY,
  HOOK_KEY,
} from '@mguay/nestjs-better-auth';
import {
  DiscoveryModule,
  DiscoveryService,
  MetadataScanner,
  Reflector,
} from '@nestjs/core';
import { betterAuth, GenericEndpointContext } from 'better-auth';
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
import { User } from '../../generated/prisma';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticationHook } from './authentication.hook.service';
import { OrganizationHook } from './organization.hook.service';
import { functions } from 'lodash';

const HOOKS = [
  { metadataKey: BEFORE_HOOK_KEY, hookType: 'before' as const },
  { metadataKey: AFTER_HOOK_KEY, hookType: 'after' as const },
];
export class AuthModule {
  static forRoot() {
    return AuthenticationModule.forRootAsync({
      imports: [
        PrismaModule,
        BridgeModule.for({
          imports: [
            DiscoveryModule,
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
          ],
          providers: [AuthenticationHook, OrganizationHook],
        }),
      ],
      useFactory(
        prisma: PrismaService,
        discover: DiscoveryService,
        reflector: Reflector,
        metadataScanner: MetadataScanner,
        authz: OpenFGAService,
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
            databaseHooks: {
              user: {
                create: {
                  after: (user: User, context) =>
                    userAfterHook(user, context, authz),
                },
                update: {
                  after: (user: User, context) =>
                    userAfterHook(user, context, authz),
                },
              },
            },
          }),
        };
      },
      inject: [
        PrismaService,
        DiscoveryService,
        Reflector,
        MetadataScanner,
        OpenFGAService,
      ],
    });
  }
}

async function userAfterHook(
  user: User,
  context: GenericEndpointContext | undefined,
  authz: OpenFGAService,
) {
  if (user.role === 'admin')
    await authz.write({
      writes: [
        {
          user: `user:${user.id}`,
          relation: 'super_user',
          object: `system:global`,
        },
      ],
    });
}
