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

@Module({
  imports: [
    ConfigifyModule.forRootAsync(),
    AuthModule.forRoot(auth),
    // For direct communication with registry on registry endpoints
    RegistryModule,
    // Handle RPC calls to identity service (concreate implementation for rpc methods in identity package)
    IdentityModule,
    AmenitiesModule,
    CategoriesModule,
    AttributeTypesModule,
    RelationshipTypesModule,
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
