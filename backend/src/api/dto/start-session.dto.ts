import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class StartSessionDto {
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(20)
  focus_block_min?: number;
}
