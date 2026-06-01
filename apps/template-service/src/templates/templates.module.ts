import { Module } from '@nestjs/common';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { TemplatesRenderer } from './templates.renderer';

@Module({
  controllers: [TemplatesController],
  providers: [TemplatesService, TemplatesRenderer],
})
export class TemplatesModule {}
