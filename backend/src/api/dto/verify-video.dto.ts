import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class VerifyVideoDto {
  @IsUUID()
  user_id!: string;

  @IsString()
  video_id!: string;

  @IsNumber()
  @Min(0)
  watch_duration_sec!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  video_duration_sec?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.25)
  playback_rate?: number;

  @IsOptional()
  @IsBoolean()
  did_seek?: boolean;
}
