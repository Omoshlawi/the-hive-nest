import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigifyModule } from '@itgorillaz/configify';
import { RegistryModule } from './registry/registry.module';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { RpcErrorInterceptor, ZodValidationExceptionFilter } from './app.utils';

const ZodPipe = {
  provide: APP_PIPE,
  useClass: ZodValidationPipe,
};

const ZodExceptionFilter = {
  provide: APP_FILTER,
  useClass: ZodValidationExceptionFilter,
};

const RCPExceptionInterceptor = {
  provide: APP_INTERCEPTOR,
  useClass: RpcErrorInterceptor,
};

@Module({
  imports: [ConfigifyModule.forRootAsync(), RegistryModule],
  controllers: [AppController],
  providers: [AppService, ZodPipe, ZodExceptionFilter, RCPExceptionInterceptor],
})
export class AppModule {}
