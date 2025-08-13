import { getFreePort } from '@hive/utils';
import { Provider } from '@nestjs/common';

export const PORT_TOKEN = 'RESOLVED_PORT';

/**
 * Provides random free port for server binding
 * Token PORT_TOKEN
 */
export const PortProvider: Provider = {
  
  provide: PORT_TOKEN,
  useFactory: async (): Promise<number> => {
    const envPort = parseInt(process.env.PORT || '0');
    return envPort === 0 ? await getFreePort() : envPort;
  },
};
