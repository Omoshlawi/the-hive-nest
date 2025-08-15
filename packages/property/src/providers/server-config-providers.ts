import { Provider } from '@nestjs/common';
import { getFreePort, ServerConfig } from '@hive/utils';
import {
  PROPERTY_HTTP_SERVER_CONFIG_TOKEN,
  PROPERTY_RPC_SERVER_CONFIG_TOKEN,
} from '../constants';

export const PropertyHTTPServerConfigProvider: Provider = {
  provide: PROPERTY_HTTP_SERVER_CONFIG_TOKEN,
  useFactory: async (): Promise<ServerConfig> => {
    const envPort = parseInt(process.env.PORT || '0');
    const port = envPort === 0 ? await getFreePort() : envPort;
    const host = '0.0.0.0';
    return { port, host };
  },
};
export const PropertyRPCServerConfigProvider: Provider = {
  provide: PROPERTY_RPC_SERVER_CONFIG_TOKEN,
  useFactory: async (): Promise<ServerConfig> => {
    const envPort = parseInt(process.env.PORT || '0');
    const port = envPort === 0 ? await getFreePort() : envPort;
    const host = '0.0.0.0';

    return { port, host };
  },
};
