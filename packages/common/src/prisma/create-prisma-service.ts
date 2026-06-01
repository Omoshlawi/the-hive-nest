import { Inject, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PRISMA_CONFIG_TOKEN } from './prisma.constants';

export function createPrismaService<T extends new (...args: any[]) => any>(
  Client: T,
) {
  class PrismaServiceMixin
    extends Client
    implements OnModuleInit, OnModuleDestroy
  {
    constructor(...args: any[]) {
      super(...args);
    }

    async onModuleInit() {
      await this.$connect();
    }

    async onModuleDestroy() {
      await this.$disconnect();
    }
  }

  // Apply @Inject(PRISMA_CONFIG_TOKEN) at index 0 programmatically — TypeScript mixin
  // classes cannot use parameter decorators directly due to the '...args: any[]' constraint.
  Inject(PRISMA_CONFIG_TOKEN)(PrismaServiceMixin, undefined as any, 0);

  return PrismaServiceMixin as unknown as new (
    ...args: any[]
  ) => InstanceType<T> & OnModuleInit & OnModuleDestroy;
}
