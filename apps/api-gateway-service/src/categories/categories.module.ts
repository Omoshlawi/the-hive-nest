import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { HiveServiceModule } from '@hive/registry';
import { HivePropertyServiceClient } from '@hive/property';

@Module({
  controllers: [CategoriesController],
  imports: [HiveServiceModule.forFeature([HivePropertyServiceClient])],
})
export class CategoriesModule {}
