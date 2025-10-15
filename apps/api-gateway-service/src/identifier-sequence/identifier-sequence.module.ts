/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Module } from '@nestjs/common';
import { IdentifierSequenceController } from './identifier-sequence.controller';
import { HiveServiceModule } from '@hive/registry';
import { HiveReferencesServiceClient } from '@hive/reference';

@Module({
  imports: [HiveServiceModule.forFeature([HiveReferencesServiceClient])],
  controllers: [IdentifierSequenceController],
})
export class IdentifierSequenceModule {}
