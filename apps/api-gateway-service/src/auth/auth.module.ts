import { QueryBuilderModule } from '@hive/common';
import { DynamicModule } from '@nestjs/common';
import { AuthModule as AuthenticationModule } from '@thallesp/nestjs-better-auth';
import { betterAuth } from 'better-auth';
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
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { adminConfig, organizationConfig } from './auth.contants';
import { AuthExtendedController } from './auth.controller';
import { SignUpHook } from './auth.hooks';

export class AuthModule {
  static forRoot(): DynamicModule {
    const authModule = this.getAuthModule();
    return {
      module: AuthModule,
      global: true,
      imports: [authModule, PrismaModule, QueryBuilderModule.register()],
      exports: [authModule],
      controllers: [AuthExtendedController],
      providers: [SignUpHook],
    };
  }

  private static getAuthModule() {
    return AuthenticationModule.forRootAsync({
      imports: [PrismaModule],
      useFactory(prisma: PrismaService) {
        return {
          auth: betterAuth({
            database: prismaAdapter(prisma, {
              provider: 'postgresql',
            }),
            plugins: [
              username(),
              anonymous(),
              admin(adminConfig),
              apiKey(),
              organization(organizationConfig),
              bearer(),
              multiSession(),
              openAPI(),
              jwt(),
            ],
            emailAndPassword: {
              enabled: true,
              // eslint-disable-next-line @typescript-eslint/require-await
              async sendResetPassword({ token }, _) {
                // http://localhost:8090/api/auth/reset-password/4IlzTEQRdCSm4B1fy4YqrVUF?callbackURL=%2Freset-password
                console.log('Token ---------', token);
                console.log('Url ---------', `/reset-password?token=${token}`);
              },
              requireEmailVerification: true,
            },
            emailVerification: {
              // eslint-disable-next-line @typescript-eslint/require-await
              async sendVerificationEmail({ token, url }, _) {
                console.log('Token ---------', token);
                console.log('URL ---------', url);
                console.log('Url ---------', `/verify-email?token=${token}`);
              },
              autoSignInAfterVerification: true,
              sendOnSignUp: true,
            },
          }),
        };
      },
      inject: [PrismaService],
    });
  }
}
