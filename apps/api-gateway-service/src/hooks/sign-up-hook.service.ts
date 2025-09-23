import { Injectable } from '@nestjs/common';

@Injectable()
export class SignUpHook {
  constructor() {}

  async handle() {
    // Custom logic like enforcing email domain registration
    // Can throw APIError if validation fails
    // await this.signUpService.execute(ctx);
    console.log('-----------------------------------------------------');
    console.log('Am here before sign up hook');
    console.log('-----------------------------------------------------');
  }
}
