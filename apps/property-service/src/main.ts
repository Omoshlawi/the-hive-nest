import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getFreePort } from '@hive/utils';
import { PORT_TOKEN } from '@hive/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = app.get(PORT_TOKEN);
  await app.listen(port);
  const serv = app.getHttpServer();
  console.log('Addr-----', serv?.address()?.port);
  console.log('Addr-----', await app?.getUrl());
  console.log('PORT-----', await getFreePort());
}
bootstrap();
