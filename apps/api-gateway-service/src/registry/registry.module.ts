import { REGISTRY_PACKAGE } from '@hive/registry';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RegistryController } from './registry.controller';
@Module({
  imports: [
    ClientsModule.register({
      clients: [
        {
          name: REGISTRY_PACKAGE.V1.TOKEN,
          transport: Transport.GRPC,
          options: {
            package: REGISTRY_PACKAGE.V1.NAME,
            protoPath: REGISTRY_PACKAGE.V1.PROTO_PATH,
            url: '0.0.0.0:4001', // TODO: move env file
          },
        },
      ],
    }),
  ],
  controllers: [RegistryController],
})
export class RegistryModule {}
