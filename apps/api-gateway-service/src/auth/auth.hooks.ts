/* eslint-disable @typescript-eslint/require-await */
import { Injectable } from '@nestjs/common';
import {
  BeforeHook,
  Hook,
  AuthHookContext,
} from '@thallesp/nestjs-better-auth';

@Hook()
@Injectable()
export class SignUpHook {
  @BeforeHook('/get-session')
  async handle(ctx: AuthHookContext) {
    // Custom logic like enforcing email domain registration
    // Can throw APIError if validation fails
    console.log('In hook', ctx);
  }
}
