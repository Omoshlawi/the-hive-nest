import { Injectable } from '@nestjs/common';
import { createPrismaService } from '@hive/common';
import { PrismaClient } from '../../generated/prisma/client';

@Injectable()
export class PrismaService extends createPrismaService(PrismaClient) {}
