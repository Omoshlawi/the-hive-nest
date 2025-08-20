import {
  CLIENT_SERVICE_CONFIG_TOKEN,
  ClientServiceConfig,
} from '@hive/registry';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor(
    @Inject(CLIENT_SERVICE_CONFIG_TOKEN) private conf: ClientServiceConfig,
  ) {
    console.log('-----------', JSON.stringify(conf, null, 2));
  }
  getHello(): string {
    return 'Hello World!';
  }
}
