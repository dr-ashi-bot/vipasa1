export interface UserProfile {
  user_id: string;
  first_name: string;
  thematic_interests: string[];
  math_level: number;
  ela_level: number;
}

export interface LearningSession {
  session_id: string;
  user_id: string;
  started_at: Date;
  expires_at: Date;
  config: SessionConfig;
  questions_completed: number;
  flow_state_achieved: boolean;
  correct_streak: number;
}

export interface SessionConfig {
  session_duration_minutes: number;
  visual_timer_type: 'puppy' | 'gymnast';
  enable_flow_state_detection: boolean;
}

export interface GeneratedContent {
  content_id: string;
  question: string;
  narrative_context: string;
  possible_answers?: string[];
  correct_answer: string;
  explanation: string;
}

export interface GamificationState {
  user_id: string;
  current_streak: number;
  streak_freezes: number;
  total_xp: number;
  weekly_xp: number;
  current_league: League;
  last_activity_date: Date;
}

export enum League {
  BRONZE = 'Bronze',
  SILVER = 'Silver',
  GOLD = 'Gold',
  SAPPHIRE = 'Sapphire',
  RUBY = 'Ruby',
  EMERALD = 'Emerald',
  AMETHYST = 'Amethyst',
  PEARL = 'Pearl',
  OBSIDIAN = 'Obsidian',
  DIAMOND = 'Diamond',
}

export interface ProgressResponse {
  xp_awarded: number;
  mastery_updated: boolean;
  new_probability: number;
  trigger_confetti: boolean;
  confetti_opacity: number;
  streak_updated: boolean;
  new_streak: number;
  mastery_achieved: boolean;
}
