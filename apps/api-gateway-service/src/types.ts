import { betterAuth } from 'better-auth';
import {
  admin,
  anonymous,
  apiKey,
  bearer,
  multiSession,
  openAPI,
  organization,
  username,
  jwt,
  AdminOptions,
  OrganizationOptions,
} from 'better-auth/plugins';
import { UserSession as BetterAuthUserSession } from '@mguay/nestjs-better-auth';

export type BetterAuthWithPlugins = ReturnType<
  typeof betterAuth<{
    plugins: [
      ReturnType<typeof username>,
      ReturnType<typeof anonymous>,
      ReturnType<typeof admin<AdminOptions>>,
      ReturnType<typeof apiKey>,
      ReturnType<typeof organization<OrganizationOptions>>,
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
