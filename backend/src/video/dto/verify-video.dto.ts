import { IsString, IsUUID, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyVideoDto {
  @ApiProperty({ description: 'User ID' })
  @IsUUID()
  user_id: string;

  @ApiProperty({
    example: 'dQw4w9WgXcQ',
    description: 'YouTube video ID',
  })
  @IsString()
  video_id: string;

  @ApiProperty({
    example: 245,
    description:
      'Actual watch duration in seconds from YouTube getCurrentTime()',
  })
  @IsNumber()
  @Min(0)
  watch_duration_sec: number;

  @ApiProperty({
    example: 270,
    description: 'Total video duration in seconds from YouTube getDuration()',
  })
  @IsNumber()
  @Min(1)
  total_duration_sec: number;

  @ApiProperty({
    example: 1,
    description: 'Playback rate (1 = normal, 2 = 2x speed)',
  })
  @IsNumber()
  @Min(0.25)
  playback_rate: number;
}
