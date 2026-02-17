import { IsEnum, IsString, IsUUID } from 'class-validator';
import { SubjectTrack } from '../../domain/enums/subject-track.enum';

export class GenerateContentDto {
  @IsUUID()
  user_id!: string;

  @IsString()
  concept_id!: string;

  @IsEnum(SubjectTrack)
  track!: SubjectTrack;
}
