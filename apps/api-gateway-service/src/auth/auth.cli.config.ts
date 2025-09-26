import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import {
  admin,
  anonymous,
  apiKey,
  bearer,
  jwt,
  multiSession,
  openAPI,
  organization,
  username,
} from 'better-auth/plugins';
import { PrismaClient } from '../../generated/prisma';
import { adminConfig, organizationConfig } from './auth.contants';
import { BetterAuthWithPlugins } from './auth.types';

const prisma = new PrismaClient();

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
