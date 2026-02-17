import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { SubjectTrack } from '../../domain/enums/subject-track.enum';

export class SubmitProgressDto {
  @IsUUID()
  user_id!: string;

  @IsString()
  concept_id!: string;

  @IsEnum(SubjectTrack)
  track!: SubjectTrack;

  @IsBoolean()
  is_correct!: boolean;

  @IsOptional()
  @IsString()
  learner_response?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  response_time_ms?: number;
}
