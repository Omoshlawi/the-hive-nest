import { HiveVirtualToursServiceClient } from '@hive/virtual-tour';
import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Virtual Tours')
@Controller('virtual-tours')
export class VirtualToursController {
  private readonly logger = new Logger(VirtualToursController.name);

  constructor(
    private readonly virtualToursService: HiveVirtualToursServiceClient,
  ) {}
  @Get('/')
  getVirtualTours() {
    return this.virtualToursService.tour.queryTour({
      queryBuilder: {
        limit: 10,
      },
    });
  }
}
