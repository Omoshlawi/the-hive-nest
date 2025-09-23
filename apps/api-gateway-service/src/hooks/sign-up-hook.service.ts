import { AuthHookContext, BeforeHook, Hook } from '@mguay/nestjs-better-auth';
import { Injectable } from '@nestjs/common';

@Hook()
@Injectable()
export class SignUpHook {
  constructor() {}

  @BeforeHook('/get-session')
  async handle(ctx: AuthHookContext) {
    // Custom logic like enforcing email domain registration
    // Can throw APIError if validation fails
    // await this.signUpService.execute(ctx);
    console.log('-----------------------------------------------------');
    console.log('Am here before getsession hook');

    console.log('-----------------------------------------------------');
  }
  //   @BeforeHook('/sign-up/email')
  //   async handle(ctx: AuthHookContext) {
  //     // Custom logic like enforcing email domain registration
  //     // Can throw APIError if validation fails
  //     // await this.signUpService.execute(ctx);
  //     console.log('-----------------------------------------------------');
  //     console.log('Am here before sign up hook');
  //     console.log('-----------------------------------------------------');
  //   }
}
