import type { auth } from './auth.cli.config';
import { UserSession as BetterAuthUserSession } from '@thallesp/nestjs-better-auth';

export type BetterAuthWithPlugins = typeof auth;

export interface UserSession extends BetterAuthUserSession {
  user: BetterAuthUserSession['user'] & {
    isAnonymous?: boolean;
  };
  session: BetterAuthUserSession['session'] & {
    activeOrganizationId?: string;
    impersonatedBy?: string;
  };
}
