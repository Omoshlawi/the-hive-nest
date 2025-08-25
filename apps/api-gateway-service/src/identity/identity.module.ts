import { Module } from '@nestjs/common';
import { IdentityService } from './identity.service';
import { IdentityController } from './identity.controller';
import { PrismaService } from '../prisma/prisma.service';

/**
 *  Handle RPC calls to identity service (concreate implementation for rpc methods in identity package)

 */
@Module({
  providers: [IdentityService, PrismaService],
  controllers: [IdentityController],
})
export class IdentityModule {}
