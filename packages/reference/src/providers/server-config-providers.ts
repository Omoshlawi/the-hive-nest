import { Provider } from '@nestjs/common';
import { getFreePort, ServerConfig } from '@hive/utils';
import {
  REFERENCE_HTTP_SERVER_CONFIG_TOKEN,
  REFERENCE_RPC_SERVER_CONFIG_TOKEN,
} from '../constants';

export const ReferenceHTTPServerConfigProvider: Provider = {
  provide: REFERENCE_HTTP_SERVER_CONFIG_TOKEN,
  useFactory: async (): Promise<ServerConfig> => {
    const envPort = parseInt(process.env.PORT || '0');
    const port = envPort === 0 ? await getFreePort() : envPort;
    const host = '0.0.0.0';
    return { port, host };
  },
};
export const ReferenceRPCServerConfigProvider: Provider = {
  provide: REFERENCE_RPC_SERVER_CONFIG_TOKEN,
  useFactory: async (): Promise<ServerConfig> => {
    const envPort = parseInt(process.env.REFERENCE_GRPC_SERVICE_PORT || '0');
    const port = envPort === 0 ? await getFreePort() : envPort;
    const host = '0.0.0.0';

    return { port, host };
  },
};
