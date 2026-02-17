import { IsString, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateContentDto {
  @ApiProperty({ description: 'User ID' })
  @IsUUID()
  user_id: string;

  @ApiProperty({
    example: 'math_6_geometry_3d_solids',
    description: 'Concept ID to generate content for',
  })
  @IsString()
  concept_id: string;

  @ApiProperty({
    required: false,
    description: 'Optional previous incorrect answer for Socratic follow-up',
  })
  @IsString()
  @IsOptional()
  previous_answer?: string;

  @ApiProperty({
    required: false,
    description: 'Session ID for context tracking',
  })
  @IsString()
  @IsOptional()
  session_id?: string;
}
