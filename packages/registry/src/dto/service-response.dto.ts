import { ApiProperty } from '@nestjs/swagger';
import { ServiceRegistryEntry } from '../interfaces/service-info.interface';

export class ServiceResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty({ required: false })
  data?: ServiceRegistryEntry | ServiceRegistryEntry[];
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
