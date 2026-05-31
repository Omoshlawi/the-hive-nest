import { QueryBuilderModule } from '@hive/common';
import { Module } from '@nestjs/common';
import { IdentityController } from './identity.controller';
/**
 *  Handle RPC calls to identity service (concreate implementation for rpc methods in identity package)

 */
@Module({
  imports: [QueryBuilderModule.register()],
  providers: [],
  controllers: [IdentityController],
})
export class IdentityModule {}
