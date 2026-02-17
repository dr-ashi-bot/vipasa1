import { SubjectTrack } from '../../database/bkt-mastery.entity';
import { FlowStateInfo } from '../../gamification/gamification.service';
import { SocraticResponse } from '../../content/content.service';

export interface ProgressSubmission {
  user_id: string;
  concept_id: string;
  session_id?: string;
  is_correct: boolean;
  user_answer?: string;
  correct_answer?: string;
  question?: string;
  time_taken_seconds?: number;
}

export interface ProgressResult {
  mastery_update: {
    concept_id: string;
    subject: SubjectTrack;
    previous_mastery: number;
    new_mastery: number;
  };
  gamification: {
    xp_earned: number;
    total_xp: number;
    streak: number;
    league: string;
    flow_state: FlowStateInfo;
  };
  feedback?: SocraticResponse;
  next_content?: any;
}
