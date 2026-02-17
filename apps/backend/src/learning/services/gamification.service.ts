import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { Model } from "mongoose";
import {
  GamificationState,
  type GamificationStateDocument,
} from "../schemas/gamification-state.schema";
import { XpLedgerEvent, type XpLedgerEventDocument } from "../schemas/xp-ledger-event.schema";
import { LEAGUE_TIERS, type LeagueTier, type ProgressEventPayload, type VideoEventPayload } from "../types";

interface LeagueSnapshot {
  current_tier: LeagueTier;
  rank_in_cohort: number;
  cohort_size: 30;
  promotion_zone_max_rank: number;
  demotion_zone_min_rank: number;
}

@Injectable()
export class GamificationService {
  constructor(
    @InjectModel(GamificationState.name)
    private readonly gamificationModel: Model<GamificationStateDocument>,
    @InjectModel(XpLedgerEvent.name)
    private readonly xpLedgerModel: Model<XpLedgerEventDocument>,
  ) {}

  async applyProgressEvent(payload: ProgressEventPayload): Promise<void> {
    const state = await this.ensureState(payload.user_id);
    this.updateDailyStreak(state, payload.submitted_at);

    if (payload.is_correct) {
      state.total_xp += payload.xp_delta;
      state.weekly_xp += payload.xp_delta;
      if (payload.response_time_sec <= 20) {
        state.quick_correct_streak += 1;
      } else {
        state.quick_correct_streak = 0;
      }
    } else {
      state.quick_correct_streak = 0;
    }

    this.applyFlowStateFade(state);
    state.current_league = this.pickLeague(state.weekly_xp);
    state.weekly_rank = await this.calculateWeeklyRank(state.user_id, state.weekly_xp);
    await state.save();

    await this.xpLedgerModel.create({
      user_id: payload.user_id,
      event_type: "progress",
      xp_delta: payload.xp_delta,
      metadata: payload,
    });
  }

  async applyVideoEvent(payload: VideoEventPayload): Promise<void> {
    if (!payload.verified || payload.xp_delta <= 0) {
      return;
    }

    const state = await this.ensureState(payload.user_id);
    this.updateDailyStreak(state, payload.submitted_at);
    state.total_xp += payload.xp_delta;
    state.weekly_xp += payload.xp_delta;
    state.current_league = this.pickLeague(state.weekly_xp);
    state.weekly_rank = await this.calculateWeeklyRank(state.user_id, state.weekly_xp);
    await state.save();

    await this.xpLedgerModel.create({
      user_id: payload.user_id,
      event_type: "video",
      xp_delta: payload.xp_delta,
      metadata: payload,
    });
  }

  async getDashboard(userId: string): Promise<{
    streak: number;
    streak_freezes: number;
    total_xp: number;
    flow_state: { confetti_opacity: number; confetti_frequency: number };
    league: LeagueSnapshot;
    quests: Array<{ title: string; target: string; reward_xp: number; expires_in_hours: number }>;
  }> {
    const state = await this.ensureState(userId);
    return {
      streak: state.current_streak,
      streak_freezes: state.streak_freezes,
      total_xp: state.total_xp,
      flow_state: {
        confetti_opacity: state.confetti_opacity,
        confetti_frequency: state.confetti_frequency,
      },
      league: this.buildLeagueSnapshot(state.current_league, state.weekly_rank),
      quests: this.generateQuests(),
    };
  }

  async getFlowState(userId: string): Promise<{ confetti_opacity: number; confetti_frequency: number }> {
    const state = await this.ensureState(userId);
    return {
      confetti_opacity: state.confetti_opacity,
      confetti_frequency: state.confetti_frequency,
    };
  }

  private async ensureState(userId: string): Promise<GamificationStateDocument> {
    const existing = await this.gamificationModel.findOne({ user_id: userId });
    if (existing) {
      return existing;
    }

    return this.gamificationModel.create({
      user_id: userId,
      current_streak: 0,
      streak_freezes: 1,
      total_xp: 0,
      current_league: "Bronze",
      weekly_xp: 0,
      weekly_rank: 30,
      quick_correct_streak: 0,
      confetti_opacity: 1,
      confetti_frequency: 1,
    });
  }

  private updateDailyStreak(state: GamificationStateDocument, submittedAtIso: string): void {
    const submissionDate = submittedAtIso.slice(0, 10);
    const lastDate = state.last_active_on;
    if (!lastDate) {
      state.current_streak = 1;
      state.last_active_on = submissionDate;
      return;
    }

    if (lastDate === submissionDate) {
      return;
    }

    const oneDayMs = 24 * 60 * 60 * 1000;
    const deltaDays = Math.floor(
      (Date.parse(submissionDate) - Date.parse(lastDate)) / oneDayMs,
    );

    if (deltaDays === 1) {
      state.current_streak += 1;
    } else if (deltaDays > 1) {
      if (state.streak_freezes > 0) {
        state.streak_freezes -= 1;
      } else {
        state.current_streak = 1;
      }
    }

    state.last_active_on = submissionDate;
  }

  private applyFlowStateFade(state: GamificationStateDocument): void {
    if (state.quick_correct_streak >= 5) {
      const fadeStep = state.quick_correct_streak - 4;
      state.confetti_opacity = Math.max(0.2, 1 - fadeStep * 0.15);
      state.confetti_frequency = Math.max(0.3, 1 - fadeStep * 0.2);
      return;
    }

    state.confetti_opacity = 1;
    state.confetti_frequency = 1;
  }

  private pickLeague(weeklyXp: number): LeagueTier {
    if (weeklyXp >= 1800) return "Diamond";
    if (weeklyXp >= 1500) return "Obsidian";
    if (weeklyXp >= 1250) return "Pearl";
    if (weeklyXp >= 1050) return "Amethyst";
    if (weeklyXp >= 850) return "Emerald";
    if (weeklyXp >= 680) return "Ruby";
    if (weeklyXp >= 520) return "Sapphire";
    if (weeklyXp >= 360) return "Gold";
    if (weeklyXp >= 220) return "Silver";
    return "Bronze";
  }

  private async calculateWeeklyRank(userId: string, weeklyXp: number): Promise<number> {
    const higherCount = await this.gamificationModel.countDocuments({
      user_id: { $ne: userId },
      weekly_xp: { $gt: weeklyXp },
    });
    return ((higherCount % 30) + 1);
  }

  private buildLeagueSnapshot(tier: LeagueTier, rank: number): LeagueSnapshot {
    const tierIndex = LEAGUE_TIERS.indexOf(tier);
    const promotion_zone_max_rank = tierIndex <= 2 ? 15 : tierIndex <= 5 ? 12 : 10;
    return {
      current_tier: tier,
      rank_in_cohort: rank,
      cohort_size: 30,
      promotion_zone_max_rank,
      demotion_zone_min_rank: 26,
    };
  }

  private generateQuests(): Array<{
    title: string;
    target: string;
    reward_xp: number;
    expires_in_hours: number;
  }> {
    const monthName = new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date());
    return [
      {
        title: "Quick Sprint",
        target: "Solve 5 problems in 3 mins",
        reward_xp: 60,
        expires_in_hours: 24,
      },
      {
        title: `${monthName} Quest`,
        target: "Complete 40 focused learning challenges",
        reward_xp: 600,
        expires_in_hours: 24 * 30,
      },
    ];
  }
}
