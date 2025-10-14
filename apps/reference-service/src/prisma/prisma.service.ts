import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, Prisma } from '../../generated/prisma';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super();

    let extendedClient = this.$extends(timestampExtension);
    extendedClient = extendedClient.$extends(auditExtension);
    extendedClient = extendedClient.$extends(lastNumberToString);

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
    identifierSequence: {
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

const lastNumberToString = Prisma.defineExtension({
  name: 'lastNumberToString',
  result: {
    identifierSequence: {
      lastNumber: {
        needs: { lastNumber: true },
        compute(data) {
          return data.lastNumber.toString();
        },
      },
    },
  },
});
