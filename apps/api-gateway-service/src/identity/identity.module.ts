import { Module } from '@nestjs/common';
import { IdentityController } from './identity.controller';
import { PrismaService } from '../prisma/prisma.service';
import { QueryBuilderModule } from '@hive/common';

/**
 *  Handle RPC calls to identity service (concreate implementation for rpc methods in identity package)

 */
@Module({
  imports: [QueryBuilderModule],
  providers: [PrismaService],
  controllers: [IdentityController],
})
export class IdentityModule {}
