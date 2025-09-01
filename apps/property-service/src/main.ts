import {
  PROPERTY_HTTP_SERVER_CONFIG_TOKEN,
  PROPERTY_PACKAGE,
  PROPERTY_RPC_SERVER_CONFIG_TOKEN
} from '@hive/property';
import { ServerConfig } from '@hive/utils';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const httpServerConfig: ServerConfig = app.get(
    PROPERTY_HTTP_SERVER_CONFIG_TOKEN,
  );
  const grpcServerConfig: ServerConfig = app.get(
    PROPERTY_RPC_SERVER_CONFIG_TOKEN,
  );
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: PROPERTY_PACKAGE.V1.NAME,
      protoPath: PROPERTY_PACKAGE.V1.PROTO_PATH,
      url: `${grpcServerConfig.host}:${grpcServerConfig.port}`,
    },
  });

  await app.startAllMicroservices();
  await app.listen(httpServerConfig.port);
}
bootstrap();
