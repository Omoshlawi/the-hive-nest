import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfig } from './config/app.config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NextFunction, Request, Response } from 'express';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { auth } from '../auth.config';
import { mergeBetterAuthSchema, ServerConfig } from '@hive/utils';
import {
  IDENTITY_PACKAGE,
  IDENTITY_RPC_SERVER_CONFIG_TOKEN,
} from '@hive/identity';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // Required for Better Auth
  });
  app.setGlobalPrefix('api');
  const appConfig = app.get(AppConfig);

  // Set up swagger docs
  const betterAuthOpenAPISchema = await auth.api.generateOpenAPISchema({
    path: '/api/auth',
  });

  const config = new DocumentBuilder()
    .setTitle('The Hive')
    .setDescription('The Hive API Documentation')
    .setVersion('1.0')
    .build();

  // Create the main Hive document
  const hiveDocument = cleanupOpenApiDoc(
    SwaggerModule.createDocument(app, config),
  );

  // Merge Better Auth paths and components into Hive document
  const mergedDocument = mergeBetterAuthSchema(
    hiveDocument,
    betterAuthOpenAPISchema,
  );

  // Setup Swagger with merged documentation
  SwaggerModule.setup('api', app, mergedDocument);

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
              <!-- Note: We're using our public proxy to avoid CORS issues. You can remove the \`data-proxy-url\` attribute if you don’t need it. -->
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

  // Set up identity server
  const serverConfig: ServerConfig = app.get(IDENTITY_RPC_SERVER_CONFIG_TOKEN);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: IDENTITY_PACKAGE.V1.NAME,
      protoPath: IDENTITY_PACKAGE.V1.PROTO_PATH,
      url: `0.0.0.0:${serverConfig.port}`,
    },
  });
  await app.startAllMicroservices();
  await app.listen(appConfig.port);
}
bootstrap();
