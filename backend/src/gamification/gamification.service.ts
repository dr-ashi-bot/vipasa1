import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import {
  GamificationState,
  GamificationStateDocument,
} from './schemas/gamification-state.schema';
import { XPEvent, XPEventDocument } from './schemas/xp-event.schema';
import {
  Leaderboard,
  LeaderboardDocument,
} from './schemas/leaderboard.schema';
import {
  League,
  LEAGUE_ORDER,
  LEAGUE_PROMOTION_SLOTS,
  LEAGUE_DEMOTION_SLOTS,
  LEAGUE_COHORT_SIZE,
} from '../common/enums/league.enum';

/** XP rewards for different actions */
const XP_REWARDS = {
  CORRECT_ANSWER: 10,
  STREAK_BONUS: 5,
  QUEST_COMPLETE: 50,
  VIDEO_COMPLETE: 25,
  SESSION_COMPLETE: 15,
};

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);
  private readonly flowStateThreshold: number;

  constructor(
    @InjectModel(GamificationState.name)
    private readonly gamificationModel: Model<GamificationStateDocument>,
    @InjectModel(XPEvent.name)
    private readonly xpEventModel: Model<XPEventDocument>,
    @InjectModel(Leaderboard.name)
    private readonly leaderboardModel: Model<LeaderboardDocument>,
    private readonly configService: ConfigService,
  ) {
    this.flowStateThreshold = parseInt(
      this.configService.get('FLOW_STATE_THRESHOLD', '5'),
      10,
    );
  }

  /**
   * Get or create gamification state for a user.
   */
  async getOrCreateState(userId: string): Promise<GamificationStateDocument> {
    let state = await this.gamificationModel.findOne({ user_id: userId });
    if (!state) {
      state = await this.gamificationModel.create({
        user_id: userId,
        current_league: League.BRONZE,
        confetti_opacity: 1.0,
        confetti_frequency: 1.0,
      });
      this.logger.log(`Created gamification state for user=${userId}`);
    }
    return state;
  }

  /**
   * Handle a correct answer: award XP, update streak, calculate flow state.
   * Returns the gamification response including confetti settings.
   */
  async handleCorrectAnswer(
    userId: string,
    conceptId: string,
    sessionId?: string,
  ): Promise<{
    xp_earned: number;
    total_xp: number;
    consecutive_correct: number;
    confetti_opacity: number;
    confetti_frequency: number;
    show_confetti: boolean;
    streak: number;
  }> {
    const state = await this.getOrCreateState(userId);

    state.consecutive_correct += 1;
    const xpEarned =
      XP_REWARDS.CORRECT_ANSWER +
      (state.consecutive_correct > 3 ? XP_REWARDS.STREAK_BONUS : 0);
    state.total_xp += xpEarned;
    state.weekly_xp += xpEarned;

    // Flow State Logic: gradually reduce confetti after threshold
    if (state.consecutive_correct >= this.flowStateThreshold) {
      const overshoot =
        state.consecutive_correct - this.flowStateThreshold;
      state.confetti_opacity = Math.max(0.1, 1.0 - overshoot * 0.15);
      state.confetti_frequency = Math.max(0.2, 1.0 - overshoot * 0.2);
    } else {
      state.confetti_opacity = 1.0;
      state.confetti_frequency = 1.0;
    }

    state.last_activity_date = new Date();
    await state.save();

    // Record XP event
    await this.xpEventModel.create({
      user_id: userId,
      event_type: 'correct_answer',
      xp_amount: xpEarned,
      concept_id: conceptId,
      session_id: sessionId,
    });

    return {
      xp_earned: xpEarned,
      total_xp: state.total_xp,
      consecutive_correct: state.consecutive_correct,
      confetti_opacity: state.confetti_opacity,
      confetti_frequency: state.confetti_frequency,
      show_confetti: state.confetti_opacity > 0.1,
      streak: state.current_streak,
    };
  }

  /**
   * Handle an incorrect answer: reset consecutive count, restore confetti.
   */
  async handleIncorrectAnswer(userId: string): Promise<void> {
    const state = await this.getOrCreateState(userId);
    state.consecutive_correct = 0;
    state.confetti_opacity = 1.0;
    state.confetti_frequency = 1.0;
    state.last_activity_date = new Date();
    await state.save();
  }

  /**
   * Update daily streak logic.
   * Called at the start of each session.
   */
  async updateStreak(userId: string): Promise<{
    current_streak: number;
    streak_freezes: number;
    streak_restored: boolean;
  }> {
    const state = await this.getOrCreateState(userId);
    const now = new Date();
    const lastActivity = state.last_activity_date;

    if (!lastActivity) {
      state.current_streak = 1;
      state.last_activity_date = now;
      await state.save();
      return {
        current_streak: 1,
        streak_freezes: state.streak_freezes,
        streak_restored: false,
      };
    }

    const diffMs = now.getTime() - lastActivity.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    let streakRestored = false;

    if (diffDays === 0) {
      // Same day, no change
    } else if (diffDays === 1) {
      // Consecutive day
      state.current_streak += 1;
    } else if (diffDays === 2 && state.streak_freezes > 0) {
      // Missed one day, use streak freeze
      state.streak_freezes -= 1;
      state.current_streak += 1;
      streakRestored = true;
    } else {
      // Streak broken
      state.current_streak = 1;
    }

    if (state.current_streak > state.longest_streak) {
      state.longest_streak = state.current_streak;
    }

    state.last_activity_date = now;
    await state.save();

    return {
      current_streak: state.current_streak,
      streak_freezes: state.streak_freezes,
      streak_restored: streakRestored,
    };
  }

  /**
   * Purchase a streak freeze with earned XP.
   */
  async purchaseStreakFreeze(
    userId: string,
  ): Promise<{ success: boolean; streak_freezes: number; total_xp: number }> {
    const FREEZE_COST = 200;
    const state = await this.getOrCreateState(userId);

    if (state.total_xp < FREEZE_COST) {
      return {
        success: false,
        streak_freezes: state.streak_freezes,
        total_xp: state.total_xp,
      };
    }

    state.total_xp -= FREEZE_COST;
    state.streak_freezes += 1;
    await state.save();

    return {
      success: true,
      streak_freezes: state.streak_freezes,
      total_xp: state.total_xp,
    };
  }

  /**
   * Award XP for completing a video.
   */
  async awardVideoXP(
    userId: string,
    videoId: string,
  ): Promise<{ xp_earned: number; total_xp: number }> {
    const state = await this.getOrCreateState(userId);
    state.total_xp += XP_REWARDS.VIDEO_COMPLETE;
    state.weekly_xp += XP_REWARDS.VIDEO_COMPLETE;
    await state.save();

    await this.xpEventModel.create({
      user_id: userId,
      event_type: 'video_complete',
      xp_amount: XP_REWARDS.VIDEO_COMPLETE,
      metadata: { video_id: videoId },
    });

    return {
      xp_earned: XP_REWARDS.VIDEO_COMPLETE,
      total_xp: state.total_xp,
    };
  }

  /**
   * Generate time-bound quests.
   */
  async generateDailyQuests(userId: string): Promise<Record<string, unknown>> {
    const state = await this.getOrCreateState(userId);

    const quests = {
      speed_challenge: {
        title: 'Solve 5 problems in 3 minutes',
        target: 5,
        current: 0,
        completed: false,
      },
      streak_quest: {
        title: 'Get a 3-answer streak',
        target: 3,
        current: 0,
        completed: false,
      },
      explorer: {
        title: 'Practice 2 different topics',
        target: 2,
        current: 0,
        completed: false,
      },
    };

    state.daily_quests = quests;

    // Generate monthly quest name
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const currentMonth = monthNames[new Date().getMonth()];
    state.monthly_quest = {
      title: `${currentMonth} Quest`,
      target: 100,
      current: 0,
      completed: false,
    };

    await state.save();
    return { daily_quests: quests, monthly_quest: state.monthly_quest };
  }

  /**
   * Get the leaderboard for the user's current cohort.
   */
  async getLeaderboard(
    userId: string,
  ): Promise<{
    entries: {
      user_id: string;
      display_name: string;
      weekly_xp: number;
      rank: number;
      zone: string;
    }[];
    user_rank: number;
    league: League;
  }> {
    const state = await this.getOrCreateState(userId);

    // For a real implementation, query the leaderboard collection
    // This is a simplified version that returns the user's own data
    const leaderboard = await this.leaderboardModel.findOne({
      cohort_id: state.cohort_id,
      finalized: false,
    });

    if (!leaderboard) {
      return {
        entries: [
          {
            user_id: userId,
            display_name: 'You',
            weekly_xp: state.weekly_xp,
            rank: 1,
            zone: 'safe',
          },
        ],
        user_rank: 1,
        league: state.current_league,
      };
    }

    const userEntry = leaderboard.entries.find((e) => e.user_id === userId);
    return {
      entries: leaderboard.entries,
      user_rank: userEntry?.rank ?? 0,
      league: state.current_league,
    };
  }

  /**
   * Finalize weekly leaderboard: promote top N, demote bottom 5.
   * Called by a scheduled task at the end of each week.
   */
  async finalizeWeeklyLeaderboard(cohortId: string): Promise<void> {
    const leaderboard = await this.leaderboardModel.findOne({
      cohort_id: cohortId,
      finalized: false,
    });

    if (!leaderboard) return;

    const sorted = [...leaderboard.entries].sort(
      (a, b) => b.weekly_xp - a.weekly_xp,
    );

    const promotionSlots =
      LEAGUE_PROMOTION_SLOTS[leaderboard.league] ?? 10;
    const total = sorted.length;

    for (let i = 0; i < sorted.length; i++) {
      sorted[i].rank = i + 1;
      if (i < promotionSlots) {
        sorted[i].zone = 'promotion';
      } else if (i >= total - LEAGUE_DEMOTION_SLOTS) {
        sorted[i].zone = 'demotion';
      } else {
        sorted[i].zone = 'safe';
      }
    }

    leaderboard.entries = sorted;
    leaderboard.finalized = true;
    await leaderboard.save();

    // Apply promotions and demotions
    for (const entry of sorted) {
      const state = await this.gamificationModel.findOne({
        user_id: entry.user_id,
      });
      if (!state) continue;

      const currentIdx = LEAGUE_ORDER.indexOf(state.current_league);

      if (entry.zone === 'promotion' && currentIdx < LEAGUE_ORDER.length - 1) {
        state.current_league = LEAGUE_ORDER[currentIdx + 1];
      } else if (entry.zone === 'demotion' && currentIdx > 0) {
        state.current_league = LEAGUE_ORDER[currentIdx - 1];
      }

      state.weekly_xp = 0;
      await state.save();
    }

    this.logger.log(`Finalized leaderboard for cohort=${cohortId}`);
  }
}
