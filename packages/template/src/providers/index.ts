import { Provider } from '@nestjs/common';
import { getFreePort, ServerConfig } from '@hive/utils';
import {
  TEMPLATE_HTTP_SERVER_CONFIG_TOKEN,
  TEMPLATE_RPC_SERVER_CONFIG_TOKEN,
} from '../constants';

export const TemplateHTTPServerConfigProvider: Provider = {
  provide: TEMPLATE_HTTP_SERVER_CONFIG_TOKEN,
  useFactory: async (): Promise<ServerConfig> => {
    const envPort = parseInt(process.env.PORT || '0');
    const port = envPort === 0 ? await getFreePort() : envPort;
    return { port, host: '0.0.0.0' };
  },
};

export const TemplateRPCServerConfigProvider: Provider = {
  provide: TEMPLATE_RPC_SERVER_CONFIG_TOKEN,
  useFactory: async (): Promise<ServerConfig> => {
    const envPort = parseInt(process.env.TEMPLATE_GRPC_SERVICE_PORT || '0');
    const port = envPort === 0 ? await getFreePort() : envPort;
    return { port, host: '0.0.0.0' };
  },
};
