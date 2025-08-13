import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RegisterServiceRequest, RegistryClientModule } from '@hive/registry';
import { ConfigifyModule } from '@itgorillaz/configify';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigifyModule.forRootAsync({ configFilePath: ['.env', 'package.json'] }),
    ScheduleModule.forRoot(),
    RegistryClientModule.register({
      url: '0.0.0.0:4001',
      service: {
        host: 'localhost',
        name: '@hive/property-service',
        version: '1.0.0',
        tags: ['properties', 'v1'],
        port: 4002,
        metadata: {
          uptime: process.uptime().toString(),
        },
      } as RegisterServiceRequest,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
