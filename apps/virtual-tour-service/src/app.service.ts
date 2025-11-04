import {
  FileUploadChunk,
  FileUploadMetadata,
  FileUploadResponse,
} from '@hive/virtual-tour';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { extname } from 'path';
import { Observable } from 'rxjs';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly prisma: PrismaService) {}
}
