import { GlobalRpcExceptionFilter } from '@hive/common';
import { ConfigifyModule } from '@itgorillaz/configify';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServiceRegistryModule } from './service-registry/service-registry.module';

@Module({
  imports: [
    ConfigifyModule.forRootAsync({ configFilePath: ['.env', 'package.json'] }),
    ScheduleModule.forRoot(),
    ServiceRegistryModule,
  ],
  controllers: [AppController],
  providers: [AppService, GlobalRpcExceptionFilter],
})
export class AppModule {}
