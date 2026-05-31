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
import { ReflectionService } from '@grpc/reflection';
import {
  HealthImplementation,
  protoPath as healthCheckProtoPath,
} from 'grpc-health-check';

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
      protoPath: [healthCheckProtoPath, REFERENCE_PACKAGE.V1.PROTO_PATH],
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
