import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from "class-validator";
import type { SubjectTrack } from "../types";

export class SubmitProgressDto {
  @IsUUID()
  user_id!: string;

  @IsString()
  @IsNotEmpty()
  concept_id!: string;

  @IsString()
  @IsIn(["Math", "ELA"])
  track!: SubjectTrack;

  @IsBoolean()
  is_correct!: boolean;

  @IsOptional()
  @IsString()
  learner_response?: string;

  @IsInt()
  @Min(1)
  response_time_sec!: number;

  @IsString()
  @IsNotEmpty()
  session_id!: string;
}
