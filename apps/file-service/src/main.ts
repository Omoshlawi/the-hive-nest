import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FILE_HTTP_SERVER_CONFIG_TOKEN,
  FILE_PACKAGE,
  FILE_RPC_SERVER_CONFIG_TOKEN,
} from '@hive/files';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ServerConfig } from '@hive/utils';
import { ReflectionService } from '@grpc/reflection';
import {
  HealthImplementation,
  protoPath as healthCheckProtoPath,
} from 'grpc-health-check';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const httpServerConfig: ServerConfig = app.get(FILE_HTTP_SERVER_CONFIG_TOKEN);
  const grpcServerConfig: ServerConfig = app.get(FILE_RPC_SERVER_CONFIG_TOKEN);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: FILE_PACKAGE.V1.NAME,
      protoPath: [healthCheckProtoPath, FILE_PACKAGE.V1.PROTO_PATH],
      url: `${grpcServerConfig.host}:${grpcServerConfig.port}`,

      onLoadPackageDefinition: (pkg, server) => {
        new ReflectionService(pkg).addToServer(server);
        const healthImpl = new HealthImplementation({
          '': 'UNKNOWN',
        });

        healthImpl.addToServer(server);
        healthImpl.setStatus('', 'SERVING');
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(httpServerConfig.port);
}
bootstrap();
