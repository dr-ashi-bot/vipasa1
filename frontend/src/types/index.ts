export type SubjectTrack = 'math' | 'ela';

export type League =
  | 'Bronze'
  | 'Silver'
  | 'Gold'
  | 'Sapphire'
  | 'Ruby'
  | 'Emerald'
  | 'Amethyst'
  | 'Pearl'
  | 'Obsidian'
  | 'Diamond';

export interface UserProfile {
  user_id: string;
  first_name: string;
  thematic_interests: string[];
  math_level: number;
  ela_level: number;
}

export interface FlowState {
  consecutive_correct: number;
  is_in_flow: boolean;
  confetti_opacity: number;
  confetti_frequency: number;
  show_confetti: boolean;
}

export interface GamificationState {
  xp_earned: number;
  total_xp: number;
  streak: number;
  league: League;
  flow_state: FlowState;
}

export interface GeneratedContent {
  concept_id: string;
  subject: SubjectTrack;
  question: string;
  narrative: string;
  hint?: string;
  correct_answer: string;
  difficulty: number;
  story_part?: number;
}

export interface SocraticResponse {
  guiding_question: string;
  encouragement: string;
  related_misconceptions: string[];
}

export interface LearningPathItem {
  concept_id: string;
  subject: SubjectTrack;
  concept_name: string;
  mastery: number;
  content?: GeneratedContent;
}

export interface SessionConfig {
  session_id: string;
  user_id: string;
  duration_minutes: number;
  visual_timer_theme: 'puppy_walk' | 'gymnast_routine';
  started_at: string;
  expires_at: string;
  learning_path: LearningPathItem[];
  is_active: boolean;
}

export interface TimerProgress {
  remaining_seconds: number;
  progress: number;
  theme: string;
  is_expired: boolean;
}

export interface ProgressResult {
  mastery_update: {
    concept_id: string;
    subject: SubjectTrack;
    previous_mastery: number;
    new_mastery: number;
  };
  gamification: GamificationState;
  feedback?: SocraticResponse;
  next_content?: GeneratedContent;
}

export interface Quest {
  quest_id: string;
  title: string;
  description?: string;
  target: number;
  progress: number;
  expires_at: string;
  type: 'daily' | 'monthly';
}

export interface LeaderboardEntry {
  user_id: string;
  weekly_xp: number;
  league: League;
  rank: number;
  zone: 'promotion' | 'safe' | 'demotion';
}

export interface VideoVerificationResult {
  verified: boolean;
  watch_percentage: number;
  xp_awarded: number;
  total_xp: number;
  reason?: string;
  show_confetti: boolean;
}
