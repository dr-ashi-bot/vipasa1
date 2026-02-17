import { IsIn, IsNotEmpty, IsString, IsUUID } from "class-validator";
import type { SubjectTrack } from "../types";

export class GenerateContentDto {
  @IsUUID()
  user_id!: string;

  @IsString()
  @IsNotEmpty()
  concept_id!: string;

  @IsString()
  @IsIn(["Math", "ELA"])
  track!: SubjectTrack;

  @IsString()
  @IsNotEmpty()
  session_id!: string;
}
