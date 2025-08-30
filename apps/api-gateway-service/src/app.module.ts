import {
  GlobalRpcExceptionInterceptor,
  GlobalZodExceptionFilter,
  GlobalZodValidationPipe,
} from '@hive/common';
import { ConfigifyModule } from '@itgorillaz/configify';
import { Module } from '@nestjs/common';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { IdentityModule } from './identity/identity.module';
import { auth } from './lib/auth';
import { RegistryModule } from './registry/registry.module';

@Module({
  imports: [
    ConfigifyModule.forRootAsync(),
    AuthModule.forRoot(auth),
    // For direct communication with registry on registry endpoints
    RegistryModule,
    // Handle RPC calls to identity service (concreate implementation for rpc methods in identity package)
    IdentityModule,
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
