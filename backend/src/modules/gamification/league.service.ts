import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GamificationState, League } from './schemas/gamification-state.schema';

const LEAGUE_TIERS = [
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

const PROMOTION_ZONE_SIZE = {
  [League.BRONZE]: 10,
  [League.SILVER]: 10,
  [League.GOLD]: 10,
  [League.SAPPHIRE]: 12,
  [League.RUBY]: 12,
  [League.EMERALD]: 13,
  [League.AMETHYST]: 13,
  [League.PEARL]: 14,
  [League.OBSIDIAN]: 14,
  [League.DIAMOND]: 15,
};

const DEMOTION_ZONE_SIZE = 5;
const COHORT_SIZE = 30;

export interface LeagueStanding {
  rank: number;
  user_id: string;
  weekly_xp: number;
  in_promotion_zone: boolean;
  in_demotion_zone: boolean;
}

@Injectable()
export class LeagueService {
  constructor(
    @InjectModel(GamificationState.name)
    private gamificationModel: Model<GamificationState>,
  ) {}

  /**
   * Get user's league standing within their cohort
   */
  async getUserLeagueStanding(user_id: string): Promise<{
    user_standing: LeagueStanding;
    cohort: LeagueStanding[];
    current_league: League;
  }> {
    const userState = await this.gamificationModel.findOne({ user_id }).exec();

    if (!userState) {
      throw new Error('User not found');
    }

    // Get cohort (30 users in same league sorted by weekly XP)
    const cohort = await this.gamificationModel
      .find({ current_league: userState.current_league })
      .sort({ weekly_xp: -1 })
      .limit(COHORT_SIZE)
      .exec();

    const promotionSize = PROMOTION_ZONE_SIZE[userState.current_league];

    const standings: LeagueStanding[] = cohort.map((state, index) => ({
      rank: index + 1,
      user_id: state.user_id,
      weekly_xp: state.weekly_xp,
      in_promotion_zone: index < promotionSize && userState.current_league !== League.DIAMOND,
      in_demotion_zone:
        index >= COHORT_SIZE - DEMOTION_ZONE_SIZE && userState.current_league !== League.BRONZE,
    }));

    const user_standing = standings.find((s) => s.user_id === user_id);

    return {
      user_standing,
      cohort: standings,
      current_league: userState.current_league,
    };
  }

  /**
   * Process weekly league promotions and demotions
   * This should be run as a scheduled job at the end of each week
   */
  async processWeeklyLeagueUpdates(): Promise<{
    promoted: number;
    demoted: number;
  }> {
    let promotedCount = 0;
    let demotedCount = 0;

    for (const league of LEAGUE_TIERS) {
      const cohort = await this.gamificationModel
        .find({ current_league: league })
        .sort({ weekly_xp: -1 })
        .limit(COHORT_SIZE)
        .exec();

      const promotionSize = PROMOTION_ZONE_SIZE[league];

      for (let i = 0; i < cohort.length; i++) {
        const state = cohort[i];

        // Promote top performers (except Diamond league)
        if (i < promotionSize && league !== League.DIAMOND) {
          const currentIndex = LEAGUE_TIERS.indexOf(league);
          const nextLeague = LEAGUE_TIERS[currentIndex + 1];
          state.current_league = nextLeague;
          promotedCount++;
        }
        // Demote bottom performers (except Bronze league)
        else if (i >= COHORT_SIZE - DEMOTION_ZONE_SIZE && league !== League.BRONZE) {
          const currentIndex = LEAGUE_TIERS.indexOf(league);
          const previousLeague = LEAGUE_TIERS[currentIndex - 1];
          state.current_league = previousLeague;
          demotedCount++;
        }

        // Reset weekly XP
        state.weekly_xp = 0;
        await state.save();
      }
    }

    return { promoted: promotedCount, demoted: demotedCount };
  }

  /**
   * Get league information
   */
  getLeagueInfo(league: League): {
    name: string;
    tier: number;
    promotion_size: number;
    demotion_size: number;
  } {
    return {
      name: league,
      tier: LEAGUE_TIERS.indexOf(league) + 1,
      promotion_size: PROMOTION_ZONE_SIZE[league],
      demotion_size: league === League.BRONZE ? 0 : DEMOTION_ZONE_SIZE,
    };
  }
}
