import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class SubmitProgressDto {
  @IsUUID()
  user_id!: string;

  @IsUUID()
  session_id!: string;

  @IsOptional()
  @IsUUID()
  content_id?: string;

  @IsString()
  concept_id!: string;

  // Required by PRD contract, but server will verify when possible.
  @IsBoolean()
  is_correct!: boolean;

  @IsOptional()
  @IsString()
  user_answer?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  response_time_ms?: number;
}

