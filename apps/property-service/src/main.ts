import {
  PROPERTY_HTTP_SERVER_CONFIG_TOKEN,
  PROPERTY_PACKAGE,
  PROPERTY_RPC_SERVER_CONFIG_TOKEN,
} from '@hive/property';
import { ServerConfig } from '@hive/utils';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { ReflectionService } from '@grpc/reflection';
import {
  HealthImplementation,
  protoPath as healthCheckProtoPath,
} from 'grpc-health-check';

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
      protoPath: [healthCheckProtoPath, PROPERTY_PACKAGE.V1.PROTO_PATH],
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
