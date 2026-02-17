import { IsString, IsUUID } from 'class-validator';

export class GenerateContentDto {
  @IsUUID()
  user_id!: string;

  @IsUUID()
  session_id!: string;

  @IsString()
  concept_id!: string;
}

