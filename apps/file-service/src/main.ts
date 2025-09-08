import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FILE_HTTP_SERVER_CONFIG_TOKEN,
  FILE_PACKAGE,
  FILE_RPC_SERVER_CONFIG_TOKEN,
} from '@hive/files';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ServerConfig } from '@hive/utils';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const httpServerConfig: ServerConfig = app.get(FILE_HTTP_SERVER_CONFIG_TOKEN);
  const grpcServerConfig: ServerConfig = app.get(FILE_RPC_SERVER_CONFIG_TOKEN);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: FILE_PACKAGE.V1.NAME,
      protoPath: FILE_PACKAGE.V1.PROTO_PATH,
      url: `${grpcServerConfig.host}:${grpcServerConfig.port}`,
    },
  });

  await app.startAllMicroservices();
  await app.listen(httpServerConfig.port);
}
bootstrap();
