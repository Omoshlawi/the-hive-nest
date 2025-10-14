import { Module } from '@nestjs/common';
import { IdentifierSequenceService } from './identifier-sequence.service';
import { IdentifierSequenceController } from './identifier-sequence.controller';

@Module({
  providers: [IdentifierSequenceService],
  controllers: [IdentifierSequenceController]
})
export class IdentifierSequenceModule {}
