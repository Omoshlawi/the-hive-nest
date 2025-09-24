import { Inject, Injectable } from '@nestjs/common';
import { OpenFgaClient } from '@openfga/sdk';
import { OpenFGAConfig } from '../interface';
import { OPEN_FGA_CONFIG_TOKEN } from '../constants';

@Injectable()
export class OpenFGAService extends OpenFgaClient {
  constructor(@Inject(OPEN_FGA_CONFIG_TOKEN) config: OpenFGAConfig) {
    super(config);
  }

  
}
