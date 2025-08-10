import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'hive.registry.v1',
        protoPath: join(__dirname, 'proto/registry.proto'),
        url: '0.0.0.0:4001',
      },
    },
  );

  await app.listen();
}
bootstrap();
