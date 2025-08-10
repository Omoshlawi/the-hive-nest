import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { REGISTRY_PACKAGE } from '@hive/registry';

async function bootstrap() {

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: REGISTRY_PACKAGE.V1.NAME,
        protoPath: REGISTRY_PACKAGE.V1.PROTO_PATH,
        url: '0.0.0.0:4001',
      },
    },
  );

  await app.listen();
}
bootstrap();
