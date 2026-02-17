import { Injectable } from '@nestjs/common';
import {
  LEAGUE_TIER_ORDER,
  LeagueTier,
} from '../domain/enums/league-tier.enum';
import { ProgressSubmittedEvent } from './gamification-event.types';

interface InternalGamificationState {
  user_id: string;
  current_streak: number;
  streak_freezes: number;
  total_xp: number;
  current_league: LeagueTier;
  weekly_xp: number;
  fast_correct_streak: number;
  last_active_at: string | null;
}

@Injectable()
export class GamificationService {
  private readonly states = new Map<string, InternalGamificationState>();

  applyProgressEvent(event: ProgressSubmittedEvent): {
    state: InternalGamificationState;
    xp_earned: number;
    flow_state: {
      confetti_enabled: boolean;
      confetti_opacity: number;
      confetti_frequency: 'full' | 'reduced';
    };
    league: ReturnType<GamificationService['buildLeagueBoard']>;
    quests: ReturnType<GamificationService['getActiveQuests']>;
  } {
    const state = this.getOrCreateState(event.user_id);
    const now = new Date(event.occurred_at);
    const xpEarned = event.is_correct ? 40 : 5;

    this.updateDailyStreak(state, now);
    state.total_xp += xpEarned;
    state.weekly_xp += xpEarned;
    state.fast_correct_streak =
      event.is_correct && event.response_time_ms <= 15_000
        ? state.fast_correct_streak + 1
        : 0;
    state.current_league = this.deriveLeague(state.weekly_xp);
    state.last_active_at = now.toISOString();
    this.states.set(state.user_id, state);

    const confettiOpacity =
      state.fast_correct_streak >= 5
        ? Number(Math.max(0.2, 1 - (state.fast_correct_streak - 5) * 0.15).toFixed(2))
        : 1;

    return {
      state,
      xp_earned: xpEarned,
      flow_state: {
        confetti_enabled: event.is_correct,
        confetti_opacity: confettiOpacity,
        confetti_frequency: state.fast_correct_streak >= 5 ? 'reduced' : 'full',
      },
      league: this.buildLeagueBoard(state.user_id),
      quests: this.getActiveQuests(),
    };
  }

  purchaseStreakFreeze(user_id: string): {
    purchased: boolean;
    state: InternalGamificationState;
    cost_xp: number;
  } {
    const state = this.getOrCreateState(user_id);
    const cost = 150;
    if (state.total_xp < cost) {
      return {
        purchased: false,
        state,
        cost_xp: cost,
      };
    }

    state.total_xp -= cost;
    state.streak_freezes += 1;
    this.states.set(state.user_id, state);
    return {
      purchased: true,
      state,
      cost_xp: cost,
    };
  }

  awardVideoCompletionXp(user_id: string, xp = 120): {
    state: InternalGamificationState;
    xp_earned: number;
    should_confetti: boolean;
  } {
    const state = this.getOrCreateState(user_id);
    state.total_xp += xp;
    state.weekly_xp += xp;
    state.current_league = this.deriveLeague(state.weekly_xp);
    this.states.set(state.user_id, state);

    return {
      state,
      xp_earned: xp,
      should_confetti: true,
    };
  }

  getState(user_id: string): InternalGamificationState {
    return this.getOrCreateState(user_id);
  }

  buildLeagueBoard(user_id: string): {
    tier: LeagueTier;
    rank: number;
    cohort_size: number;
    promotion_zone: number;
    demotion_zone_start: number;
    entries: Array<{
      user_id: string;
      display_name: string;
      xp: number;
      rank: number;
    }>;
  } {
    const state = this.getOrCreateState(user_id);
    const cohortSize = 30;
    const bots = Array.from({ length: cohortSize - 1 }).map((_, index) => {
      const syntheticXp = Math.max(
        0,
        state.weekly_xp + this.syntheticDelta(user_id, index) - 450,
      );
      return {
        user_id: `bot-${index + 1}`,
        display_name: `Learner ${index + 1}`,
        xp: syntheticXp,
      };
    });
    const entries = [
      ...bots,
      {
        user_id,
        display_name: 'Ashi',
        xp: state.weekly_xp,
      },
    ]
      .sort((a, b) => b.xp - a.xp)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));
    const rank =
      entries.find((entry) => entry.user_id === user_id)?.rank ?? cohortSize;

    return {
      tier: state.current_league,
      rank,
      cohort_size: cohortSize,
      promotion_zone: this.promotionSlotsByTier(state.current_league),
      demotion_zone_start: cohortSize - 5 + 1,
      entries,
    };
  }

  getActiveQuests(now = new Date()): Array<{
    title: string;
    objective: string;
    expires_at: string;
  }> {
    const threeMinutesFromNow = new Date(now.getTime() + 3 * 60 * 1000);
    const monthQuestEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    const monthName = now.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });
    return [
      {
        title: 'Speed Quest',
        objective: 'Solve 5 problems in 3 mins',
        expires_at: threeMinutesFromNow.toISOString(),
      },
      {
        title: `${monthName} Quest`,
        objective: 'Complete 40 adaptive practice problems this month',
        expires_at: monthQuestEnd.toISOString(),
      },
    ];
  }

  private getOrCreateState(user_id: string): InternalGamificationState {
    const existing = this.states.get(user_id);
    if (existing) {
      return existing;
    }

    const created: InternalGamificationState = {
      user_id,
      current_streak: 0,
      streak_freezes: 0,
      total_xp: 0,
      current_league: LeagueTier.BRONZE,
      weekly_xp: 0,
      fast_correct_streak: 0,
      last_active_at: null,
    };
    this.states.set(user_id, created);
    return created;
  }

  private updateDailyStreak(
    state: InternalGamificationState,
    now: Date,
  ): void {
    if (!state.last_active_at) {
      state.current_streak = 1;
      return;
    }

    const last = new Date(state.last_active_at);
    const dayDiff = this.utcDayDifference(last, now);
    if (dayDiff <= 0) {
      return;
    }

    if (dayDiff === 1) {
      state.current_streak += 1;
      return;
    }

    if (state.streak_freezes > 0) {
      state.streak_freezes -= 1;
      return;
    }

    state.current_streak = 1;
  }

  private deriveLeague(weeklyXp: number): LeagueTier {
    const index = Math.min(
      LEAGUE_TIER_ORDER.length - 1,
      Math.floor(weeklyXp / 600),
    );
    return LEAGUE_TIER_ORDER[index];
  }

  private promotionSlotsByTier(tier: LeagueTier): number {
    switch (tier) {
      case LeagueTier.BRONZE:
      case LeagueTier.SILVER:
      case LeagueTier.GOLD:
      case LeagueTier.SAPPHIRE:
      case LeagueTier.RUBY:
        return 15;
      default:
        return 10;
    }
  }

  private utcDayDifference(previous: Date, next: Date): number {
    const previousUtc = Date.UTC(
      previous.getUTCFullYear(),
      previous.getUTCMonth(),
      previous.getUTCDate(),
    );
    const nextUtc = Date.UTC(
      next.getUTCFullYear(),
      next.getUTCMonth(),
      next.getUTCDate(),
    );
    return Math.floor((nextUtc - previousUtc) / (24 * 60 * 60 * 1000));
  }

  private syntheticDelta(seed: string, offset: number): number {
    const source = `${seed}:${offset}`;
    let hash = 0;
    for (let i = 0; i < source.length; i += 1) {
      hash = (hash << 5) - hash + source.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash % 900);
  }
}
