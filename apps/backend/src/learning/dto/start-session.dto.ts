import { IsIn, IsOptional, IsString, IsUUID } from "class-validator";

export class StartSessionDto {
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @IsOptional()
  @IsString()
  @IsIn(["puppy-walk", "gymnast-routine"])
  preferred_visual_theme?: "puppy-walk" | "gymnast-routine";
}
