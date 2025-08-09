import { ConfigifyModule } from '@itgorillaz/configify';
import { Module } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ZodValidationExceptionFilter } from './app.utils';
import { ServiceRegistryModule } from './service-registry/service-registry.module';

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
    ConfigifyModule.forRootAsync({ configFilePath: ['.env', 'package.json'] }),
    ScheduleModule.forRoot(),
    ServiceRegistryModule,
  ],
  controllers: [AppController],
  providers: [AppService, ZodePipe, ZodExceptionFilter],
})
export class AppModule {}
