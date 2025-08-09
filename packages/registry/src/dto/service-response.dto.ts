import { ApiProperty } from '@nestjs/swagger';
import { ServiceRegistryEntry } from '../interfaces/service-info.interface';

export class ServicesResponseDto {
  @ApiProperty()
  message: string;

  @ApiProperty({ required: false })
  results: ServiceRegistryEntry[];
}

export class HealthResponseDto {
  @ApiProperty()
  status: string;

  @ApiProperty()
  timestamp: number;

  @ApiProperty()
  uptime: number;

  @ApiProperty()
  storage: {
    type: string;
    healthy: boolean;
  };
}
