import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GamificationState, League } from '../database/gamification-state.schema';

/**
 * League Service
 *
 * Manages the 10-tier league system inspired by Duolingo:
 * Bronze → Silver → Gold → Sapphire → Ruby → Emerald → Amethyst → Pearl → Obsidian → Diamond
 *
 * Weekly 30-person cohorts compete on XP.
 * Top 10-15 players get promoted, bottom 5 get demoted.
 */

const LEAGUE_ORDER: League[] = [
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

interface LeagueZones {
  promotion_count: number;
  demotion_count: number;
}

const LEAGUE_ZONES: Record<League, LeagueZones> = {
  [League.BRONZE]: { promotion_count: 15, demotion_count: 0 },
  [League.SILVER]: { promotion_count: 15, demotion_count: 5 },
  [League.GOLD]: { promotion_count: 12, demotion_count: 5 },
  [League.SAPPHIRE]: { promotion_count: 12, demotion_count: 5 },
  [League.RUBY]: { promotion_count: 10, demotion_count: 5 },
  [League.EMERALD]: { promotion_count: 10, demotion_count: 5 },
  [League.AMETHYST]: { promotion_count: 10, demotion_count: 5 },
  [League.PEARL]: { promotion_count: 10, demotion_count: 5 },
  [League.OBSIDIAN]: { promotion_count: 10, demotion_count: 5 },
  [League.DIAMOND]: { promotion_count: 0, demotion_count: 5 },
};

export interface LeaderboardEntry {
  user_id: string;
  weekly_xp: number;
  league: League;
  rank: number;
  zone: 'promotion' | 'safe' | 'demotion';
}

@Injectable()
export class LeagueService {
  private readonly logger = new Logger(LeagueService.name);

  constructor(
    @InjectModel(GamificationState.name)
    private readonly gamificationModel: Model<GamificationState>,
  ) {}

  /**
   * Get the weekly leaderboard for a user's current league.
   * Returns up to 30 users in the same league, sorted by weekly XP.
   */
  async getLeaderboard(userId: string): Promise<LeaderboardEntry[]> {
    const state = await this.gamificationModel.findOne({ user_id: userId });
    if (!state) return [];

    const league = state.current_league;
    const leagueMembers = await this.gamificationModel
      .find({ current_league: league })
      .sort({ weekly_xp: -1 })
      .limit(30);

    const zones = LEAGUE_ZONES[league];

    return leagueMembers.map((member, index) => {
      let zone: 'promotion' | 'safe' | 'demotion' = 'safe';
      if (index < zones.promotion_count) zone = 'promotion';
      if (index >= leagueMembers.length - zones.demotion_count)
        zone = 'demotion';

      return {
        user_id: member.user_id,
        weekly_xp: member.weekly_xp,
        league: member.current_league,
        rank: index + 1,
        zone,
      };
    });
  }

  /**
   * Check if a user qualifies for promotion or demotion.
   */
  async checkPromotion(userId: string): Promise<void> {
    const state = await this.gamificationModel.findOne({ user_id: userId });
    if (!state) return;

    const currentIndex = LEAGUE_ORDER.indexOf(state.current_league);
    if (currentIndex < 0) return;

    // Promotion thresholds based on weekly XP milestones
    const promotionThresholds: Record<League, number> = {
      [League.BRONZE]: 100,
      [League.SILVER]: 200,
      [League.GOLD]: 350,
      [League.SAPPHIRE]: 500,
      [League.RUBY]: 700,
      [League.EMERALD]: 900,
      [League.AMETHYST]: 1200,
      [League.PEARL]: 1500,
      [League.OBSIDIAN]: 2000,
      [League.DIAMOND]: Infinity,
    };

    const threshold = promotionThresholds[state.current_league];
    if (
      state.weekly_xp >= threshold &&
      currentIndex < LEAGUE_ORDER.length - 1
    ) {
      state.current_league = LEAGUE_ORDER[currentIndex + 1];
      this.logger.log(
        `User ${userId} promoted to ${state.current_league}!`,
      );
      await state.save();
    }
  }

  /**
   * Weekly reset: run at end of each week to process promotions/demotions.
   */
  async processWeeklyReset(): Promise<void> {
    for (const league of LEAGUE_ORDER) {
      const members = await this.gamificationModel
        .find({ current_league: league })
        .sort({ weekly_xp: -1 });

      const zones = LEAGUE_ZONES[league];
      const leagueIdx = LEAGUE_ORDER.indexOf(league);

      for (let i = 0; i < members.length; i++) {
        const member = members[i];

        if (i < zones.promotion_count && leagueIdx < LEAGUE_ORDER.length - 1) {
          member.current_league = LEAGUE_ORDER[leagueIdx + 1];
          this.logger.log(
            `User ${member.user_id} promoted from ${league} to ${member.current_league}`,
          );
        } else if (
          i >= members.length - zones.demotion_count &&
          leagueIdx > 0
        ) {
          member.current_league = LEAGUE_ORDER[leagueIdx - 1];
          this.logger.log(
            `User ${member.user_id} demoted from ${league} to ${member.current_league}`,
          );
        }

        member.weekly_xp = 0;
        await member.save();
      }
    }
  }

  getLeagueOrder(): League[] {
    return LEAGUE_ORDER;
  }

  getLeagueZones(): Record<League, LeagueZones> {
    return LEAGUE_ZONES;
  }
}
