import { UserSession as BetterAuthUserSession } from '@thallesp/nestjs-better-auth';
import { betterAuth } from 'better-auth';
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
import { adminConfig, organizationConfig } from './auth.contants';

export type BetterAuthWithPlugins = ReturnType<
  typeof betterAuth<{
    plugins: [
      ReturnType<typeof username>,
      ReturnType<typeof anonymous>,
      ReturnType<typeof admin<typeof adminConfig>>,
      ReturnType<typeof apiKey>,
      ReturnType<typeof organization<typeof organizationConfig>>,
      ReturnType<typeof bearer>,
      ReturnType<typeof multiSession>,
      ReturnType<typeof openAPI>,
      ReturnType<typeof jwt>,
    ];
  }>
>;

export interface UserSession extends BetterAuthUserSession {
  user: BetterAuthUserSession['user'] & {
    isAnonymous?: boolean;
    // Add any other user fields as needed
  };
  session: BetterAuthUserSession['session'] & {
    activeOrganizationId?: string;
    impersonatedBy?: string;
    // Add any other session fields as needed
  };
}
