import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GamificationState, League } from './schemas/gamification-state.schema';

export interface GamificationUpdateResult {
  xp_awarded: number;
  trigger_confetti: boolean;
  confetti_opacity: number;
  new_streak: number;
  flow_state_active: boolean;
}

@Injectable()
export class GamificationService {
  private readonly XP_CORRECT_ANSWER = 10;
  private readonly XP_STREAK_BONUS = 5;
  private readonly FLOW_STATE_THRESHOLD = 5;

  // Flow state confetti fade parameters
  private readonly CONFETTI_MAX_OPACITY = 1.0;
  private readonly CONFETTI_MIN_OPACITY = 0.2;

  constructor(
    @InjectModel(GamificationState.name)
    private gamificationModel: Model<GamificationState>,
  ) {}

  /**
   * Initialize gamification state for a new user
   */
  async initializeUser(user_id: string): Promise<GamificationState> {
    const existingState = await this.gamificationModel.findOne({ user_id }).exec();
    if (existingState) {
      return existingState;
    }

    const newState = new this.gamificationModel({
      user_id,
      current_streak: 0,
      streak_freezes: 0,
      total_xp: 0,
      weekly_xp: 0,
      current_league: League.BRONZE,
      last_activity_date: new Date(),
      week_start_date: this.getWeekStart(),
    });

    return newState.save();
  }

  /**
   * Award XP for correct answers and update streaks
   * Implements Flow State Design - reduces confetti as user achieves flow
   */
  async awardXP(
    user_id: string,
    base_xp: number,
    reason: 'correct_answer' | 'video_completed' | 'quest',
  ): Promise<GamificationUpdateResult> {
    let state = await this.gamificationModel.findOne({ user_id }).exec();

    if (!state) {
      state = await this.initializeUser(user_id);
    }

    // Check if we need to reset weekly XP
    const currentWeekStart = this.getWeekStart();
    if (!state.week_start_date || state.week_start_date < currentWeekStart) {
      state.weekly_xp = 0;
      state.week_start_date = currentWeekStart;
    }

    // Update streak
    const today = new Date().toDateString();
    const lastActivity = state.last_activity_date
      ? state.last_activity_date.toDateString()
      : null;

    if (lastActivity !== today) {
      // Check if streak should continue or break
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();

      if (lastActivity === yesterdayStr) {
        // Streak continues
        state.current_streak += 1;
      } else {
        // Streak broken
        state.current_streak = 1;
      }
    }

    // Calculate XP with streak bonus
    let xp_awarded = base_xp;
    if (state.current_streak >= 3) {
      xp_awarded += this.XP_STREAK_BONUS;
    }

    // Update XP totals
    state.total_xp += xp_awarded;
    state.weekly_xp += xp_awarded;
    state.last_activity_date = new Date();

    await state.save();

    // Determine confetti behavior based on flow state
    const flow_state_active = state.current_streak >= this.FLOW_STATE_THRESHOLD;
    const confetti_opacity = this.calculateConfettiOpacity(state.current_streak);

    return {
      xp_awarded,
      trigger_confetti: true,
      confetti_opacity,
      new_streak: state.current_streak,
      flow_state_active,
    };
  }

  /**
   * Calculate confetti opacity based on streak (Flow State Design)
   * As streak increases, confetti fades to allow intrinsic motivation to take over
   */
  private calculateConfettiOpacity(streak: number): number {
    if (streak < this.FLOW_STATE_THRESHOLD) {
      return this.CONFETTI_MAX_OPACITY;
    }

    // Linear fade from max to min opacity after flow state threshold
    const fadeProgress = Math.min(
      (streak - this.FLOW_STATE_THRESHOLD) / 10,
      1.0,
    );

    return (
      this.CONFETTI_MAX_OPACITY -
      fadeProgress * (this.CONFETTI_MAX_OPACITY - this.CONFETTI_MIN_OPACITY)
    );
  }

  /**
   * Use a streak freeze to prevent streak loss
   */
  async useStreakFreeze(user_id: string): Promise<boolean> {
    const state = await this.gamificationModel.findOne({ user_id }).exec();

    if (!state || state.streak_freezes <= 0) {
      return false;
    }

    state.streak_freezes -= 1;
    state.last_activity_date = new Date();
    await state.save();

    return true;
  }

  /**
   * Purchase streak freeze with XP
   */
  async purchaseStreakFreeze(user_id: string, cost: number = 100): Promise<boolean> {
    const state = await this.gamificationModel.findOne({ user_id }).exec();

    if (!state || state.total_xp < cost) {
      return false;
    }

    state.total_xp -= cost;
    state.streak_freezes += 1;
    await state.save();

    return true;
  }

  /**
   * Get user's gamification state
   */
  async getUserState(user_id: string): Promise<GamificationState> {
    let state = await this.gamificationModel.findOne({ user_id }).exec();

    if (!state) {
      state = await this.initializeUser(user_id);
    }

    return state;
  }

  /**
   * Get week start date (Monday)
   */
  private getWeekStart(): Date {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to Monday
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  /**
   * Get leaderboard data for the current week
   */
  async getWeeklyLeaderboard(limit: number = 30): Promise<any[]> {
    const weekStart = this.getWeekStart();

    return this.gamificationModel
      .find({
        week_start_date: { $gte: weekStart },
      })
      .sort({ weekly_xp: -1 })
      .limit(limit)
      .select('user_id weekly_xp current_league')
      .exec();
  }
}
