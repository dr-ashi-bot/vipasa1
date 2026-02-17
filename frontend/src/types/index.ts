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

export interface UserProfile {
  user_id: string;
  first_name: string;
  thematic_interests: string[];
  math_level: number;
  ela_level: number;
  avatar_url?: string;
  total_sessions_completed: number;
}

export interface GamificationState {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  streak_freezes: number;
  total_xp: number;
  weekly_xp: number;
  current_league: League;
  consecutive_correct: number;
  confetti_opacity: number;
  confetti_frequency: number;
  daily_quests: Record<
    string,
    { title?: string; target: number; current: number; completed: boolean }
  >;
  monthly_quest: {
    title: string;
    target: number;
    current: number;
    completed: boolean;
  };
}

export interface BKTMastery {
  mastery_id: string;
  concept_id: string;
  track: 'math' | 'ela';
  probability_known: number;
  total_attempts: number;
  correct_attempts: number;
}

export interface SessionResponse {
  session_id: string;
  duration_minutes: number;
  expires_at: string;
  learning_path: {
    math_next: { concept_id: string; mastery: number } | null;
    ela_next: { concept_id: string; mastery: number } | null;
  };
  visual_timer: {
    type: string;
    theme: string;
    total_seconds: number;
  };
  streak_info: {
    current_streak: number;
    streak_freezes: number;
    streak_restored: boolean;
  };
  quests: Record<string, unknown>;
}

export interface ContentResponse {
  content: {
    story_text: string;
    question: string;
    options: string[];
    correct_answer: string;
    hint: string;
    explanation: string;
    story_continuation: string;
    socratic_question?: string;
    error_analysis?: string;
    encouragement?: string;
  };
  mastery_level: number;
  concept_id: string;
  track: 'math' | 'ela';
}

export interface ProgressResponse {
  mastery: {
    concept_id: string;
    probability_known: number;
    is_mastered: boolean;
    total_attempts: number;
    correct_attempts: number;
  };
  gamification: {
    xp_earned: number;
    total_xp: number;
    consecutive_correct: number;
    confetti_opacity: number;
    confetti_frequency: number;
    show_confetti: boolean;
    streak: number;
  };
}

export interface VideoVerifyResponse {
  verified: boolean;
  xp_earned: number;
  total_xp: number;
  reason?: string;
  show_confetti: boolean;
}

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  weekly_xp: number;
  rank: number;
  zone: 'promotion' | 'safe' | 'demotion';
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  user_rank: number;
  league: League;
}
