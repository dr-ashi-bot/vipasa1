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

export type LeagueTier = (typeof LEAGUE_TIERS)[number];

export function leagueForTotalXp(totalXp: number): LeagueTier {
  // Simple, deterministic tiering for MVP.
  if (totalXp >= 12000) return 'Diamond';
  if (totalXp >= 9000) return 'Obsidian';
  if (totalXp >= 7000) return 'Pearl';
  if (totalXp >= 5500) return 'Amethyst';
  if (totalXp >= 4200) return 'Emerald';
  if (totalXp >= 3200) return 'Ruby';
  if (totalXp >= 2400) return 'Sapphire';
  if (totalXp >= 1600) return 'Gold';
  if (totalXp >= 800) return 'Silver';
  return 'Bronze';
}
