import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigifyModule } from '@itgorillaz/configify';
import { ServiceRegistryModule } from './service-registry/service-registry.module';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { ZodValidationExceptionFilter } from './app.utils';
import { ScheduleModule } from '@nestjs/schedule';
import { StorageModule } from './storage/storage.module';

const ZodePipe = {
  provide: APP_PIPE,
  useClass: ZodValidationPipe,
};

const ZodExceptionFilter = {
  provide: APP_FILTER,
  useClass: ZodValidationExceptionFilter,
};

@Module({
  imports: [
    ConfigifyModule.forRootAsync(),
    ScheduleModule.forRoot(),
    ServiceRegistryModule,
  ],
  controllers: [AppController],
  providers: [AppService, ZodePipe, ZodExceptionFilter],
})
export class AppModule {}
