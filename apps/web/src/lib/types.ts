export type SubjectTrack = "Math" | "ELA";

export const LEAGUE_TIERS = [
  "Bronze",
  "Silver",
  "Gold",
  "Sapphire",
  "Ruby",
  "Emerald",
  "Amethyst",
  "Pearl",
  "Obsidian",
  "Diamond",
] as const;

export type LeagueTier = (typeof LEAGUE_TIERS)[number];

export const MATH_CONCEPTS = [
  "math_6_geometry_3d_solids",
  "math_6_integer_operations",
  "math_6_multi_step_equations",
] as const;

export const ELA_CONCEPTS = [
  "ela_4_decodable_words",
  "ela_4_main_idea",
  "ela_4_sentence_fluency",
] as const;

export interface UserProfile {
  user_id: string;
  first_name: string;
  thematic_interests: string[];
  math_level: number;
  ela_level: number;
}

export interface BktMastery {
  mastery_id: string;
  user_id: string;
  concept_id: string;
  track: SubjectTrack;
  probability_known: number;
  slip: number;
  guess: number;
  transition: number;
  updated_at: string;
}

export interface GamificationState {
  user_id: string;
  current_streak: number;
  streak_freezes: number;
  total_xp: number;
  current_league: LeagueTier;
  weekly_xp: number;
  weekly_rank: number;
  quick_correct_streak: number;
  confetti_opacity: number;
  confetti_frequency: number;
  last_active_on: string;
}

export interface SessionState {
  session_id: string;
  user_id: string;
  starts_at: string;
  expires_at: string;
  duration_minutes: number;
  visual_theme: "puppy-walk" | "gymnast-routine";
}

export interface MemoryEvent {
  id: string;
  user_id: string;
  concept_id: string;
  kind: "misconception" | "success" | "content";
  text: string;
  created_at: string;
}
