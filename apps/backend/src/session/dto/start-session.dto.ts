import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class StartSessionDto {
  @IsUUID()
  user_id!: string;

  @IsOptional()
  @IsInt()
  @Min(900)
  @Max(1200)
  duration_sec?: number;

  @IsOptional()
  @IsString()
  @IsIn(['math', 'ela'])
  preferred_track?: 'math' | 'ela';
}

