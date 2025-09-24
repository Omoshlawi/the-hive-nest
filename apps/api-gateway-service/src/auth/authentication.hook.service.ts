import { OpenFGAService } from '@hive/authorization';
import {
  AfterHook,
  AuthHookContext,
  BeforeHook,
  Hook,
} from '@mguay/nestjs-better-auth';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';

@Hook()
@Injectable()
export class AuthenticationHook {
  private logger = new Logger(AuthenticationHook.name);
  constructor(private readonly authzService: OpenFGAService) {}
  @AfterHook('/delete-user')
  async handleUserCreated(ctx: AuthHookContext) {
    const status = (ctx.context.returned as any).statusCode;
    if (status === HttpStatus.OK) {
      this.logger.log('User deleted succesfully, cleaning auth touples');
      //  await this.authzService.write({deletes: [{user: `user:${ctx.}`}]})
    } else {
      this.logger.warn(
        'Delete failed with status ' + status + '.Skipping cleaning tupples',
      );
    }
  }
}
