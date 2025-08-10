import { Module } from '@nestjs/common';
import { RegistryController } from './registry.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SERVICE_REGISTRY_CLIENT } from '@hive/registry';
import { join } from 'path';
@Module({
  imports: [
    ClientsModule.register({
      clients: [
        {
          name: SERVICE_REGISTRY_CLIENT,
          transport: Transport.GRPC,
          options: {
            package: 'hive.registry.v1',
            protoPath: join(__dirname, '../proto/registry.proto'),
            url: '0.0.0.0:4001',
          },
        },
      ],
    }),
  ],
  controllers: [RegistryController],
})
export class RegistryModule {}
