import { IsBoolean, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitProgressDto {
  @ApiProperty({ example: 'uuid-here', description: 'User ID' })
  @IsUUID()
  user_id: string;

  @ApiProperty({
    example: 'math_6_geometry',
    description: 'Concept ID following pattern: {track}_{grade}_{topic}',
  })
  @IsString()
  concept_id: string;

  @ApiProperty({
    example: true,
    description: 'Whether the answer was correct',
  })
  @IsBoolean()
  is_correct: boolean;
}
