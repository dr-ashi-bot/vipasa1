import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  GamificationState,
  GamificationStateDocument,
  LeagueTier,
} from '../schemas/gamification-state.schema';

const LEAGUE_TIERS: LeagueTier[] = [
  LeagueTier.Bronze,
  LeagueTier.Silver,
  LeagueTier.Gold,
  LeagueTier.Sapphire,
  LeagueTier.Ruby,
  LeagueTier.Emerald,
  LeagueTier.Amethyst,
  LeagueTier.Pearl,
  LeagueTier.Obsidian,
  LeagueTier.Diamond,
];

const XP_PER_CORRECT = 10;
const STREAK_FREEZE_COST = 100;

@Injectable()
export class GamificationService {
  constructor(
    @InjectModel(GamificationState.name)
    private gamificationModel: Model<GamificationStateDocument>,
  ) {}

  async getState(userId: string): Promise<GamificationStateDocument | null> {
    return this.gamificationModel.findOne({ user_id: userId }).exec();
  }

  async getOrCreateState(userId: string): Promise<GamificationStateDocument> {
    let state = await this.gamificationModel.findOne({ user_id: userId }).exec();
    if (!state) {
      state = await this.gamificationModel.create({
        user_id: userId,
        current_streak: 0,
        streak_freezes: 0,
        total_xp: 0,
        current_league: LeagueTier.Bronze,
        last_activity_date: new Date(),
        weekly_xp: 0,
        week_start: this.getWeekStart(),
      });
    }
    return state;
  }

  async awardXp(userId: string, xp: number, correctInRow?: number): Promise<{
    totalXp: number;
    streak: number;
    league: LeagueTier;
    confettiIntensity: number;
  }> {
    const state = await this.getOrCreateState(userId);
    const now = new Date();

    state.total_xp += xp;
    state.last_activity_date = now;

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastDate = state.last_activity_date
      ? new Date(state.last_activity_date)
      : null;
    const lastDateStr = lastDate?.toDateString();
    const todayStr = now.toDateString();

    if (lastDateStr === todayStr) {
      // Same day, no streak change
    } else if (lastDateStr === yesterday.toDateString()) {
      state.current_streak = (state.current_streak || 0) + 1;
    } else if (lastDateStr !== todayStr) {
      if (state.streak_freezes > 0) {
        state.streak_freezes -= 1;
      } else {
        state.current_streak = 0;
      }
    }

    const weekStart = this.getWeekStart();
    if (new Date(state.week_start) < weekStart) {
      state.weekly_xp = xp;
      state.week_start = weekStart;
    } else {
      state.weekly_xp = (state.weekly_xp || 0) + xp;
    }

    await state.save();

    const confettiIntensity = this.computeConfettiIntensity(correctInRow ?? 1);

    return {
      totalXp: state.total_xp,
      streak: state.current_streak,
      league: state.current_league,
      confettiIntensity,
    };
  }

  private computeConfettiIntensity(correctInRow: number): number {
    if (correctInRow <= 2) return 1;
    if (correctInRow <= 4) return 0.7;
    if (correctInRow <= 5) return 0.5;
    return 0.3;
  }

  async purchaseStreakFreeze(userId: string): Promise<boolean> {
    const state = await this.getOrCreateState(userId);
    if (state.total_xp >= STREAK_FREEZE_COST) {
      state.total_xp -= STREAK_FREEZE_COST;
      state.streak_freezes = (state.streak_freezes || 0) + 1;
      await state.save();
      return true;
    }
    return false;
  }

  async getLeagueLeaderboard(
    userId: string,
    league: LeagueTier,
  ): Promise<Array<{ user_id: string; weekly_xp: number; rank: number }>> {
    const weekStart = this.getWeekStart();
    const users = await this.gamificationModel
      .find({ current_league: league, week_start: { $gte: weekStart } })
      .sort({ weekly_xp: -1 })
      .limit(30)
      .exec();

    return users.map((u, i) => ({
      user_id: u.user_id,
      weekly_xp: u.weekly_xp,
      rank: i + 1,
    }));
  }

  getPromotionDemotionZones(league: LeagueTier): {
    promoteCount: number;
    demoteCount: number;
  } {
    const tierIdx = LEAGUE_TIERS.indexOf(league);
    const promoteCount = tierIdx >= 7 ? 5 : tierIdx >= 4 ? 12 : 15;
    const demoteCount = 5;
    return { promoteCount, demoteCount };
  }

  private getWeekStart(): Date {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}
