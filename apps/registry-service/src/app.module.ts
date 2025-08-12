import { ConfigifyModule } from '@itgorillaz/configify';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServiceRegistryModule } from './service-registry/service-registry.module';
import { APP_FILTER } from '@nestjs/core';
import { RpcExceptionHandler } from './app.utils';

const RCPExceptionFilter = {
  provide: APP_FILTER,
  useClass: RpcExceptionHandler,
};

@Module({
  imports: [
    ConfigifyModule.forRootAsync({ configFilePath: ['.env', 'package.json'] }),
    ScheduleModule.forRoot(),
    ServiceRegistryModule,
  ],
  controllers: [AppController],
  providers: [AppService, RCPExceptionFilter],
})
export class AppModule {}
