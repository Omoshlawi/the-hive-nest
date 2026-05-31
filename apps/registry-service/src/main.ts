import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { REGISTRY_PACKAGE } from '@hive/registry';
import { ReflectionService } from '@grpc/reflection';
import { HealthImplementation, protoPath as healthCheckProtoPath } from 'grpc-health-check';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: REGISTRY_PACKAGE.V1.NAME,
        protoPath: [healthCheckProtoPath, REGISTRY_PACKAGE.V1.PROTO_PATH],
        url: '0.0.0.0:4001',
        onLoadPackageDefinition: (pkg, server) => {
          new ReflectionService(pkg).addToServer(server);

          const healthImpl = new HealthImplementation({
            '': 'UNKNOWN',
          });

          healthImpl.addToServer(server);
          healthImpl.setStatus('', 'SERVING');
        },
      },
    },
  );

  await app.listen();
}
void bootstrap();
