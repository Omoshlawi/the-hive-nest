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
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import {
  adminAcl,
  adminRoles,
  organizationAcl,
  organizationRoles,
} from './auth.acl';

const HOOKS = [
  { metadataKey: BEFORE_HOOK_KEY, hookType: 'before' as const },
  { metadataKey: AFTER_HOOK_KEY, hookType: 'after' as const },
];
export class AuthModule {
  static forRoot() {
    return AuthenticationModule.forRootAsync({
      imports: [PrismaModule, DiscoveryModule],
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
              admin({ ac: adminAcl, roles: adminRoles }),
              apiKey(),
              organization({
                ac: organizationAcl,
                roles: organizationRoles,
                teams: {
                  enabled: true,
                },
                dynamicAccessControl: {
                  enabled: true,
                },
              }),
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
    });
  }
}
