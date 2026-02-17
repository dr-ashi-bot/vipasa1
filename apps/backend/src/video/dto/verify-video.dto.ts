import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class VerifyVideoDto {
  @IsUUID()
  user_id!: string;

  @IsString()
  video_id!: string;

  @IsInt()
  @Min(0)
  watch_duration_sec!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  video_duration_sec?: number;

  @IsOptional()
  @IsInt()
  playback_rate?: number;

  @IsOptional()
  @IsBoolean()
  skipped?: boolean;
}

