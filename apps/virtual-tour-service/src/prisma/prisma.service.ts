/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '../../generated/prisma';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super();

    let extendedClient = this.$extends(timestampExtension);
    // extendedClient = extendedClient.$extends(auditExtension);
    extendedClient = extendedClient.$extends(hotspotsToString);

    return extendedClient as this;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

// Extension 1: Convert timestamps to ISO strings with full type safety
const timestampExtension = Prisma.defineExtension({
  name: 'timestampToISOString',
  result: {
    tour: {
      createdAt: {
        needs: { createdAt: true },
        compute(data) {
          return data.createdAt instanceof Date
            ? data.createdAt.toISOString()
            : data.createdAt;
        },
      },
      updatedAt: {
        needs: { updatedAt: true },
        compute(data) {
          return data.updatedAt instanceof Date
            ? data.updatedAt.toISOString()
            : data.updatedAt;
        },
      },
    },
  },
});

// Extension 2: Audit logging with full type safety
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const auditExtension = Prisma.defineExtension({
  name: 'audit',
  query: {
    $allModels: {
      async create({ args, query, model }) {
        console.log(`[AUDIT] Creating ${model}:`, args);
        const result = await query(args);
        console.log(`[AUDIT] Created ${model}:`, result);
        return result;
      },
      async update({ args, query, model }) {
        console.log(`[AUDIT] Updating ${model}:`, args);
        const result = await query(args);
        console.log(`[AUDIT] Updated ${model}:`, result);
        return result;
      },
      async delete({ args, query, model }) {
        console.log(`[AUDIT] Deleting ${model}:`, args);
        const result = await query(args);
        console.log(`[AUDIT] Deleted ${model}:`, result);
        return result;
      },
    },
  },
});

const hotspotsToString = Prisma.defineExtension({
  name: 'hotspotsToString',
  result: {
    scene: {
      hotspots: {
        needs: { hotspots: true },
        compute(data): string {
          return JSON.stringify(data.hotspots);
        },
      },
    },
  },
});
