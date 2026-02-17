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

export const LEAGUE_ORDER: League[] = [
  League.BRONZE,
  League.SILVER,
  League.GOLD,
  League.SAPPHIRE,
  League.RUBY,
  League.EMERALD,
  League.AMETHYST,
  League.PEARL,
  League.OBSIDIAN,
  League.DIAMOND,
];

export const LEAGUE_PROMOTION_SLOTS: Record<League, number> = {
  [League.BRONZE]: 15,
  [League.SILVER]: 15,
  [League.GOLD]: 12,
  [League.SAPPHIRE]: 12,
  [League.RUBY]: 10,
  [League.EMERALD]: 10,
  [League.AMETHYST]: 10,
  [League.PEARL]: 10,
  [League.OBSIDIAN]: 10,
  [League.DIAMOND]: 0,
};

export const LEAGUE_DEMOTION_SLOTS = 5;
export const LEAGUE_COHORT_SIZE = 30;
