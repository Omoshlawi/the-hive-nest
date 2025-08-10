import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigifyModule } from '@itgorillaz/configify';
import { RegistryModule } from './registry/registry.module';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { ZodValidationExceptionFilter } from './app.utils';

const ZodPipe = {
  provide: APP_PIPE,
  useClass: ZodValidationPipe,
};

const ZodExceptionFilter = {
  provide: APP_FILTER,
  useClass: ZodValidationExceptionFilter,
};

@Module({
  imports: [ConfigifyModule.forRootAsync(), 
    RegistryModule
  ],
  controllers: [AppController],
  providers: [AppService, ZodPipe, ZodExceptionFilter],
})
export class AppModule {}
