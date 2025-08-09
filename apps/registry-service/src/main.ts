import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { NextFunction, Request, Response } from 'express';
import { AppConfig } from './config/app.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const appConfig = app.get(AppConfig);

  const config = new DocumentBuilder()
    .setTitle('The Hive Service registry Service')
    .setDescription('Hive Service Registry API for dynamic service descovery')
    .setVersion('1.0')
    .build();
  const documentFactory = () =>
    cleanupOpenApiDoc(SwaggerModule.createDocument(app, config));
  SwaggerModule.setup('api', app, documentFactory);

  app.use('/api-doc', (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(`<!doctype html>
          <html>
            <head>
              <title>Scalar API Reference</title>
              <meta charset="utf-8" />
              <meta
                name="viewport"
                content="width=device-width, initial-scale=1" />
            </head>
            <body>
              <!-- Need a Custom Header? Check out this example: https://codepen.io/scalarorg/pen/VwOXqam -->
              <!-- Note: We’re using our public proxy to avoid CORS issues. You can remove the \`data-proxy-url\` attribute if you don’t need it. -->
              <script
                id="api-reference"
                data-url="/api-json"></script>

              <!-- Optional: You can set a full configuration object like this: -->
              <script>
                var configuration = {
                  theme: 'purple',
                }

                document.getElementById('api-reference').dataset.configuration =
                  JSON.stringify(configuration)
              </script>

              <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
            </body>
          </html>`);
    res.end();
  });
  await app.listen(appConfig.port);
}
bootstrap();
