/* eslint-disable @typescript-eslint/no-floating-promises */
import { ServerConfig } from '@hive/utils';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  REFERENCE_HTTP_SERVER_CONFIG_TOKEN,
  REFERENCE_PACKAGE,
  REFERENCE_RPC_SERVER_CONFIG_TOKEN,
} from '@hive/reference';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const httpServerConfig: ServerConfig = app.get(
    REFERENCE_HTTP_SERVER_CONFIG_TOKEN,
  );
  const grpcServerConfig: ServerConfig = app.get(
    REFERENCE_RPC_SERVER_CONFIG_TOKEN,
  );
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: REFERENCE_PACKAGE.V1.NAME,
      protoPath: REFERENCE_PACKAGE.V1.PROTO_PATH,
      url: `${grpcServerConfig.host}:${grpcServerConfig.port}`,
    },
  });

  await app.startAllMicroservices();
  await app.listen(httpServerConfig.port);
}
bootstrap();
