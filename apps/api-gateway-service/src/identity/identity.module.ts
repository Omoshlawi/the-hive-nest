import { QueryBuilderModule } from '@hive/common';
import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IdentityController } from './identity.controller';

/**
 *  Handle RPC calls to identity service (concreate implementation for rpc methods in identity package)

 */
@Module({
  imports: [QueryBuilderModule.register()],
  providers: [PrismaService],
  controllers: [IdentityController],
})
export class IdentityModule {}
