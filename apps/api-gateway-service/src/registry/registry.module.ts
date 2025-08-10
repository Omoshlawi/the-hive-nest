import { Module } from '@nestjs/common';
import { RegistryController } from './registry.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { REGISTRY_PACKAGE } from '@hive/registry';
import { join } from 'path';
@Module({
  imports: [
    ClientsModule.register({
      clients: [
        {
          name: REGISTRY_PACKAGE.V1.TOKEN,
          transport: Transport.GRPC,
          options: {
            package: 'hive.registry.v1',
            protoPath: REGISTRY_PACKAGE.V1.PROTO_PATH,
            url: '0.0.0.0:4001',
          },
        },
      ],
    }),
  ],
  controllers: [RegistryController],
})
export class RegistryModule {}
