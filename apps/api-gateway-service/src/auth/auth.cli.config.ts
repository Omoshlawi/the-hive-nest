import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import {
  admin,
  anonymous,
  bearer,
  jwt,
  multiSession,
  openAPI,
  organization,
  username,
} from 'better-auth/plugins';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { adminConfig, organizationConfig } from './auth.contants';
import { BetterAuthWithPlugins } from './auth.types';
import { apiKey } from "@better-auth/api-key"


const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export const auth: BetterAuthWithPlugins = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  plugins: [
    username(),
    anonymous(),
    admin(adminConfig),
    apiKey(),
    organization(organizationConfig),
    bearer(),
    multiSession(),
    openAPI(),
    jwt(),
  ],
});
