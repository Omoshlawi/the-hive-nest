import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Module({
  controllers: [FilesController],
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
})
export class FilesModule {}
