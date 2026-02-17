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

export interface SessionState {
  session_id: string;
  user_id: string;
  starts_at: string;
  expires_at: string;
  duration_minutes: number;
  visual_theme: "puppy-walk" | "gymnast-routine";
}

export interface ProgressEventPayload {
  user_id: string;
  concept_id: string;
  track: SubjectTrack;
  is_correct: boolean;
  response_time_sec: number;
  xp_delta: number;
  submitted_at: string;
}

export interface VideoEventPayload {
  user_id: string;
  video_id: string;
  verified: boolean;
  xp_delta: number;
  completion_ratio: number;
  submitted_at: string;
}
