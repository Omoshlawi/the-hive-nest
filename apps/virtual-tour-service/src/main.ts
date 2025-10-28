/* eslint-disable @typescript-eslint/no-floating-promises */
import { ServerConfig } from '@hive/utils';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  VIRTUAL_TOUR_HTTP_SERVER_CONFIG_TOKEN,
  VIRTUAL_TOUR_PACKAGE,
  VIRTUAL_TOUR_RPC_SERVER_CONFIG_TOKEN,
} from '@hive/virtual-tour';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const httpServerConfig: ServerConfig = app.get(
    VIRTUAL_TOUR_HTTP_SERVER_CONFIG_TOKEN,
  );
  const grpcServerConfig: ServerConfig = app.get(
    VIRTUAL_TOUR_RPC_SERVER_CONFIG_TOKEN,
  );
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: VIRTUAL_TOUR_PACKAGE.V1.NAME,
      protoPath: VIRTUAL_TOUR_PACKAGE.V1.PROTO_PATH,
      url: `${grpcServerConfig.host}:${grpcServerConfig.port}`,
    },
  });

  await app.startAllMicroservices();
  await app.listen(httpServerConfig.port);
}
bootstrap();
