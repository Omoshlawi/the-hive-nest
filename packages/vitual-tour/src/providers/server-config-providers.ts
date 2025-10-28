import { Provider } from '@nestjs/common';
import { getFreePort, ServerConfig } from '@hive/utils';
import {
  VIRTUAL_TOUR_HTTP_SERVER_CONFIG_TOKEN,
  VIRTUAL_TOUR_RPC_SERVER_CONFIG_TOKEN,
} from '../constants';

export const VirtualTourHTTPServerConfigProvider: Provider = {
  provide: VIRTUAL_TOUR_HTTP_SERVER_CONFIG_TOKEN,
  useFactory: async (): Promise<ServerConfig> => {
    const envPort = parseInt(process.env.PORT || '0');
    const port = envPort === 0 ? await getFreePort() : envPort;
    const host = '0.0.0.0';
    return { port, host };
  },
};
export const VirtualTourRPCServerConfigProvider: Provider = {
  provide: VIRTUAL_TOUR_RPC_SERVER_CONFIG_TOKEN,
  useFactory: async (): Promise<ServerConfig> => {
    const envPort = parseInt(process.env.VIRTUAL_TOUR_GRPC_SERVICE_PORT || '0');
    const port = envPort === 0 ? await getFreePort() : envPort;
    const host = '0.0.0.0';

    return { port, host };
  },
};
