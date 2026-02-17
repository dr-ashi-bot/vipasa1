import { IsUUID, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StartSessionDto {
  @ApiProperty({ description: 'User ID' })
  @IsUUID()
  user_id: string;

  @ApiProperty({
    required: false,
    example: 15,
    description: 'Session duration in minutes (default: 15, max: 20)',
  })
  @IsInt()
  @Min(5)
  @Max(20)
  @IsOptional()
  duration_minutes?: number;
}
