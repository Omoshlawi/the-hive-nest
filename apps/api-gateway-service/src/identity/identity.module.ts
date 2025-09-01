import { Module } from '@nestjs/common';
import { IdentityController } from './identity.controller';
import { PrismaService } from '../prisma/prisma.service';
import { QueryBuilderModule } from '@hive/common';
import {
  Endpoint,
  HiveServiceModule,
  RegistryClientConfig,
} from '@hive/registry';
import { ServerConfig } from '@hive/utils';
import {
  HIVE_IDENTITY_SERVICE_NAME,
  IDENTITY_RPC_SERVER_CONFIG_TOKEN,
  IdentityRPCServerConfigProvider,
} from '@hive/identity';

/**
 *  Handle RPC calls to identity service (concreate implementation for rpc methods in identity package)

 */
@Module({
  imports: [
    QueryBuilderModule.register(),
    HiveServiceModule.forRoot({
      services: [],
      enableHeartbeat: true,
      client: {
        useFactory: (config: RegistryClientConfig, grpc: ServerConfig) => {
          if (!config) {
            throw new Error('RegistryClientConfig is required');
          }
          return {
            service: {
              metadata: config.metadata ?? {},
              name: HIVE_IDENTITY_SERVICE_NAME,
              version: config.serviceVersion,
              tags: [grpc ? 'grpc' : undefined].filter(
                Boolean,
              ) as Array<string>, // Tag the server used in service
              endpoints: [
                grpc
                  ? {
                      host: grpc.host,
                      port: grpc.port,
                      protocol: 'grpc',
                      metadata: {},
                    }
                  : undefined,
              ].filter(Boolean) as Array<Endpoint>,
            },
          };
        },
        inject: [RegistryClientConfig, IDENTITY_RPC_SERVER_CONFIG_TOKEN],
        providers: [IdentityRPCServerConfigProvider],
      },
    }),
  ],
  providers: [PrismaService],
  controllers: [IdentityController],
})
export class IdentityModule {}
