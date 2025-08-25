import { IDENTITY_HTTP_SERVER_CONFIG_TOKEN } from '@hive/identity';
import { ServerConfig } from '@hive/utils';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const conf: ServerConfig = app.get(IDENTITY_HTTP_SERVER_CONFIG_TOKEN);
  await app.listen(conf.port);
}
bootstrap();
