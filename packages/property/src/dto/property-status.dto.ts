import { ApiProperty } from '@nestjs/swagger';

export class GetStatusHistoryEntryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  voided: boolean;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
