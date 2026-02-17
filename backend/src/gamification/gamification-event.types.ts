import { SubjectTrack } from '../domain/enums/subject-track.enum';

export interface ProgressSubmittedEvent {
  user_id: string;
  concept_id: string;
  track: SubjectTrack;
  is_correct: boolean;
  response_time_ms: number;
  occurred_at: string;
}
