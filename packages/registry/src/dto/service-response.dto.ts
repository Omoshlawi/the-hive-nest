import { ApiProperty } from '@nestjs/swagger';
import {ServiceRegistration} from "../types"
export class ServicesResponseDto {
  @ApiProperty()
  message: string;

  @ApiProperty({ required: false })
  results: ServiceRegistration[];
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
