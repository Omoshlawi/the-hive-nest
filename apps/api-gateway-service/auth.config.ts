import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from './generated/prisma';
import {
  username,
  anonymous,
  admin,
  apiKey,
  organization,
  bearer,
  multiSession,
  openAPI,
  jwt,
} from 'better-auth/plugins';
import { BetterAuthWithPlugins } from './src/types';

const prisma = new PrismaClient();

export const auth: BetterAuthWithPlugins = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  plugins: [
    username(),
    anonymous(),
    admin(),
    apiKey(),
    organization({}),
    bearer(),
    multiSession(),
    openAPI(),
    jwt(),
  ],
});
