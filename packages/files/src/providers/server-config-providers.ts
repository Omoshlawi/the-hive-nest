import { Provider } from '@nestjs/common';
import { getFreePort, ServerConfig } from '@hive/utils';
import {
  FILE_HTTP_SERVER_CONFIG_TOKEN,
  FILE_RPC_SERVER_CONFIG_TOKEN,
} from '../constants';

export const FileHTTPServerConfigProvider: Provider = {
  provide: FILE_HTTP_SERVER_CONFIG_TOKEN,
  useFactory: async (): Promise<ServerConfig> => {
    const envPort = parseInt(process.env.PORT || '0');
    const port = envPort === 0 ? await getFreePort() : envPort;
    const host = '0.0.0.0';
    return { port, host };
  },
};
export const FileRPCServerConfigProvider: Provider = {
  provide: FILE_RPC_SERVER_CONFIG_TOKEN,
  useFactory: async (): Promise<ServerConfig> => {
    const envPort = parseInt(process.env.FILE_GRPC_SERVICE_PORT || '0');
    const port = envPort === 0 ? await getFreePort() : envPort;
    const host = '0.0.0.0';

    return { port, host };
  },
};
