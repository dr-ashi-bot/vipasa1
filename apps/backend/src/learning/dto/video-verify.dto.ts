import { IsInt, IsNotEmpty, IsNumber, IsString, IsUUID, Min } from "class-validator";

export class VideoVerifyDto {
  @IsUUID()
  user_id!: string;

  @IsString()
  @IsNotEmpty()
  video_id!: string;

  @IsNumber()
  @Min(0)
  watch_duration_sec!: number;

  @IsNumber()
  @Min(1)
  video_duration_sec!: number;

  @IsNumber()
  @Min(0)
  playback_rate_avg!: number;

  @IsInt()
  @Min(0)
  seek_events!: number;
}
