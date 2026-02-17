import { IsString, IsOptional, IsInt, IsArray, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'Ashi', description: 'First name of the student' })
  @IsString()
  @IsOptional()
  first_name?: string;

  @ApiProperty({
    example: ['gymnastics', 'cute puppies'],
    description: 'Thematic interests for content personalization',
  })
  @IsArray()
  @IsOptional()
  thematic_interests?: string[];

  @ApiProperty({ example: 6, description: 'Current math grade level (1-12)' })
  @IsInt()
  @Min(1)
  @Max(12)
  @IsOptional()
  math_level?: number;

  @ApiProperty({ example: 4, description: 'Current ELA grade level (1-12)' })
  @IsInt()
  @Min(1)
  @Max(12)
  @IsOptional()
  ela_level?: number;
}
