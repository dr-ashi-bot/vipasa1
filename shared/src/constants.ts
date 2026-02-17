// ============================================================================
// Gamification Constants
// ============================================================================

export const LEAGUE_TIERS = [
  'Bronze',
  'Silver',
  'Gold',
  'Sapphire',
  'Ruby',
  'Emerald',
  'Amethyst',
  'Pearl',
  'Obsidian',
  'Diamond',
] as const;

export const LEAGUE_COHORT_SIZE = 30;

export const PROMOTION_ZONE_SIZE = {
  Bronze: 10,
  Silver: 10,
  Gold: 10,
  Sapphire: 12,
  Ruby: 12,
  Emerald: 13,
  Amethyst: 13,
  Pearl: 14,
  Obsidian: 14,
  Diamond: 15,
} as const;

export const DEMOTION_ZONE_SIZE = 5;

// ============================================================================
// XP Rewards
// ============================================================================

export const XP_CORRECT_ANSWER = 10;
export const XP_VIDEO_COMPLETION = 20;
export const XP_QUEST_MULTIPLIER = 1.5;
export const XP_STREAK_BONUS = 5;

// ============================================================================
// Session Configuration
// ============================================================================

export const DEFAULT_SESSION_DURATION_MINUTES = 15;
export const MAX_SESSION_DURATION_MINUTES = 30;
export const MIN_SESSION_DURATION_MINUTES = 10;

// ============================================================================
// Flow State Detection
// ============================================================================

export const FLOW_STATE_CORRECT_STREAK = 5;
export const FLOW_STATE_CONFETTI_FADE_START = 0.8;
export const FLOW_STATE_CONFETTI_FADE_END = 0.2;

// ============================================================================
// BKT Parameters
// ============================================================================

export const BKT_INITIAL_PROBABILITY = 0.3;
export const BKT_LEARNING_RATE = 0.3;
export const BKT_GUESS_PROBABILITY = 0.25;
export const BKT_SLIP_PROBABILITY = 0.1;
export const BKT_MASTERY_THRESHOLD = 0.85;

// ============================================================================
// Video Verification
// ============================================================================

export const VIDEO_COMPLETION_THRESHOLD = 0.9; // 90%
export const VIDEO_MIN_WATCH_DURATION_SEC = 30;

// ============================================================================
// Lexile Levels
// ============================================================================

export const LEXILE_LEVELS = {
  1: { min: 190, max: 530 },
  2: { min: 420, max: 650 },
  3: { min: 520, max: 820 },
  4: { min: 740, max: 940 }, // Ashi's ELA level
  5: { min: 830, max: 1010 },
  6: { min: 925, max: 1070 }, // Ashi's Math level
  7: { min: 970, max: 1120 },
  8: { min: 1010, max: 1185 },
} as const;

// ============================================================================
// Default User Configuration (Ashi)
// ============================================================================

export const DEFAULT_USER = {
  first_name: 'Ashi',
  thematic_interests: ['gymnastics', 'cute puppies'],
  math_level: 6,
  ela_level: 4,
} as const;
