import { DynamicModule, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RegisterServiceRequest } from 'types';
import { REGISTRY_PACKAGE } from '../constants';
import { RegistryClientService } from './registry-client.service';
import { PortProvider } from '@hive/common';

export interface RegistryClientModuleOptions {
  url: string;
  service: RegisterServiceRequest;
}

@Module({})
export class RegistryClientModule {
  static register(options: RegistryClientModuleOptions): DynamicModule {
    return {
      module: RegistryClientModule,
      imports: [
        ClientsModule.register({
          clients: [
            {
              name: REGISTRY_PACKAGE.V1.TOKEN,
              transport: Transport.GRPC,
              options: {
                package: REGISTRY_PACKAGE.V1.NAME,
                protoPath: REGISTRY_PACKAGE.V1.PROTO_PATH,
                url: options.url,
              },
            },
          ],
        }),
      ],
      providers: [PortProvider, RegistryClientService],
      exports: [RegistryClientService],
    };
  }
}
