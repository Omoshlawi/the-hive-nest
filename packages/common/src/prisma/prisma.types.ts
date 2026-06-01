import { Type } from '@nestjs/common';

export type PrismaAsyncOptions = {
  service: Type<any>;
  useFactory: (...args: any[]) => Promise<Record<string, unknown>> | Record<string, unknown>;
  inject: Type<any>[];
  global: boolean;
};
