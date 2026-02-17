// ============================================================================
// User and Profile Types
// ============================================================================

export interface UserProfile {
  user_id: string;
  first_name: string;
  thematic_interests: string[];
  math_level: number;
  ela_level: number;
  created_at?: Date;
  updated_at?: Date;
}

// ============================================================================
// Gamification Types
// ============================================================================

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

export interface GamificationState {
  user_id: string;
  current_streak: number;
  streak_freezes: number;
  total_xp: number;
  current_league: League;
  last_activity_date?: Date;
  weekly_xp?: number;
  updated_at?: Date;
}

export interface Quest {
  quest_id: string;
  title: string;
  description: string;
  target_count: number;
  time_limit_minutes?: number;
  xp_reward: number;
  is_monthly: boolean;
  expires_at?: Date;
}

export interface UserQuest {
  user_id: string;
  quest_id: string;
  progress: number;
  completed: boolean;
  started_at: Date;
}

// ============================================================================
// BKT (Bayesian Knowledge Tracing) Types
// ============================================================================

export interface BKTMastery {
  mastery_id: string;
  user_id: string;
  concept_id: string;
  probability_known: number; // 0.0 to 1.0
  attempts: number;
  correct_count: number;
  last_attempted?: Date;
  updated_at?: Date;
}

export enum ConceptDomain {
  MATH = 'math',
  ELA = 'ela',
}

export interface Concept {
  concept_id: string;
  domain: ConceptDomain;
  grade_level: number;
  name: string;
  description: string;
  prerequisites?: string[];
}

// ============================================================================
// Content Generation Types
// ============================================================================

export interface ContentGenerationRequest {
  user_id: string;
  concept_id: string;
  difficulty_level?: number;
  include_memory?: boolean;
}

export interface ContentGenerationResponse {
  content_id: string;
  question: string;
  possible_answers?: string[];
  correct_answer: string;
  explanation?: string;
  narrative_context?: string;
}

// ============================================================================
// Session Types
// ============================================================================

export interface SessionConfig {
  session_duration_minutes: number;
  visual_timer_type: 'puppy' | 'gymnast';
  enable_flow_state_detection: boolean;
}

export interface LearningSession {
  session_id: string;
  user_id: string;
  started_at: Date;
  expires_at: Date;
  config: SessionConfig;
  questions_completed: number;
  flow_state_achieved: boolean;
}

// ============================================================================
// Progress Tracking Types
// ============================================================================

export interface ProgressSubmission {
  user_id: string;
  session_id: string;
  content_id: string;
  concept_id: string;
  is_correct: boolean;
  time_taken_seconds: number;
  answer_given: string;
}

export interface ProgressResponse {
  xp_awarded: number;
  mastery_updated: boolean;
  new_probability: number;
  trigger_confetti: boolean;
  confetti_opacity: number;
  streak_updated: boolean;
  new_streak: number;
}

// ============================================================================
// Video Verification Types
// ============================================================================

export interface VideoVerificationRequest {
  user_id: string;
  video_id: string;
  watch_duration_sec: number;
  video_duration_sec: number;
}

export interface VideoVerificationResponse {
  verified: boolean;
  xp_awarded: number;
  completion_percentage: number;
  trigger_confetti: boolean;
}

// ============================================================================
// AI/RAG Types
// ============================================================================

export interface UserMemory {
  user_id: string;
  memory_id: string;
  content: string;
  embedding?: number[];
  memory_type: 'conversation' | 'misconception' | 'preference' | 'achievement';
  created_at: Date;
  metadata?: Record<string, any>;
}

export interface SocraticFeedback {
  question: string;
  hint_level: number;
  related_memories: UserMemory[];
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface StartSessionRequest {
  user_id: string;
  session_config?: Partial<SessionConfig>;
}

export interface StartSessionResponse {
  session: LearningSession;
  recommended_concepts: string[];
  user_profile: UserProfile;
}
