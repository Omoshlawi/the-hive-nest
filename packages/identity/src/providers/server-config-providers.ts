import { Provider } from '@nestjs/common';
import { getFreePort, ServerConfig } from '@hive/utils';
import {
  IDENTITY_HTTP_SERVER_CONFIG_TOKEN,
  IDENTITY_RPC_SERVER_CONFIG_TOKEN,
} from '../constants';

export const IdentityHTTPServerConfigProvider: Provider = {
  provide: IDENTITY_HTTP_SERVER_CONFIG_TOKEN,
  useFactory: async (): Promise<ServerConfig> => {
    const envPort = parseInt(process.env.PORT || '0');
    const port = envPort === 0 ? await getFreePort() : envPort;
    const host = '0.0.0.0';
    return { port, host };
  },
};
export const IdentityRPCServerConfigProvider: Provider = {
  provide: IDENTITY_RPC_SERVER_CONFIG_TOKEN,
  useFactory: async (): Promise<ServerConfig> => {
    const envPort = parseInt(process.env.IDENTITY_SERVICE_PORT || '0');
    const port = envPort === 0 ? await getFreePort() : envPort;
    const host = '0.0.0.0';

    return { port, host };
  },
};
