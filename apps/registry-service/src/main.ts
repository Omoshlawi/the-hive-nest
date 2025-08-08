import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('The Hive Service registry Service')
    .setDescription('Hive Service Registry API for dynamic service descovery')
    .setVersion('1.0')
    .build();
  const documentFactory = () =>
    cleanupOpenApiDoc(SwaggerModule.createDocument(app, config));
  SwaggerModule.setup('api', app, documentFactory);
  await app.listen(process.env.PORT ?? 4001);
}
bootstrap();
