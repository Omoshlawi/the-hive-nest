import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class IdentityService {
  private readonly logger = new Logger(IdentityService.name);
  constructor() {}


}
