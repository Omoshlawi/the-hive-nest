import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Configuration } from '@itgorillaz/configify';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(Configuration)
  await app.listen(config ?? 5);
}
bootstrap();
