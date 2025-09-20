import { CustomDecorator, SetMetadata } from '@nestjs/common';

export const AUTHORIZATION_KEY = 'authorization';

export interface AuthorizationMetadata {
  service: string;
  action: string;
  resourceType: string;
  resourceParam?: string;
  skipAuth?: boolean;
}

export const RequireAuthorization = (
  service: string,
  action: string,
  resourceType: string,
  resourceParam?: string,
): CustomDecorator =>
  SetMetadata(AUTHORIZATION_KEY, {
    service,
    action,
    resourceType,
    resourceParam,
  });

export const SkipAuthorization = (): CustomDecorator =>
  SetMetadata(AUTHORIZATION_KEY, { skipAuth: true });
