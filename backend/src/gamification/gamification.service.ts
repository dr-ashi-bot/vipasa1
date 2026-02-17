import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GamificationState, League } from '../database/gamification-state.schema';
import { XpEvent, XpEventType } from '../database/xp-event.schema';

export interface FlowStateInfo {
  consecutive_correct: number;
  is_in_flow: boolean;
  confetti_opacity: number;
  confetti_frequency: number;
  show_confetti: boolean;
}

export interface AnswerResult {
  xp_earned: number;
  total_xp: number;
  streak: number;
  flow_state: FlowStateInfo;
  quest_progress: any[];
  league: League;
}

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  /**
   * XP awarded per action
   */
  private static readonly XP_CORRECT_ANSWER = 10;
  private static readonly XP_STREAK_BONUS = 5;
  private static readonly XP_VIDEO_COMPLETION = 15;
  private static readonly XP_QUEST_COMPLETION = 50;

  /**
   * Flow state thresholds:
   * After 5 consecutive correct answers in quick succession,
   * begin fading extrinsic rewards (confetti).
   */
  private static readonly FLOW_THRESHOLD = 5;
  private static readonly FLOW_FADE_RATE = 0.15;

  constructor(
    @InjectModel(GamificationState.name)
    private readonly gamificationModel: Model<GamificationState>,
    @InjectModel(XpEvent.name)
    private readonly xpEventModel: Model<XpEvent>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getOrCreateState(userId: string): Promise<GamificationState> {
    let state = await this.gamificationModel.findOne({ user_id: userId });
    if (!state) {
      state = await this.gamificationModel.create({
        user_id: userId,
        current_streak: 0,
        streak_freezes: 0,
        total_xp: 0,
        weekly_xp: 0,
        current_league: League.BRONZE,
        consecutive_correct: 0,
      });
    }
    return state;
  }

  /**
   * Process a correct answer: award XP, update streak, calculate flow state.
   */
  async processCorrectAnswer(userId: string): Promise<AnswerResult> {
    const state = await this.getOrCreateState(userId);

    state.consecutive_correct += 1;
    state.total_xp += GamificationService.XP_CORRECT_ANSWER;
    state.weekly_xp += GamificationService.XP_CORRECT_ANSWER;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastActivity = state.last_activity_date
      ? new Date(state.last_activity_date)
      : null;

    if (lastActivity) {
      lastActivity.setHours(0, 0, 0, 0);
      const diffDays = Math.floor(
        (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diffDays === 1) {
        state.current_streak += 1;
        state.total_xp += GamificationService.XP_STREAK_BONUS;
        state.weekly_xp += GamificationService.XP_STREAK_BONUS;
      } else if (diffDays > 1) {
        state.current_streak = 1;
      }
    } else {
      state.current_streak = 1;
    }
    state.last_activity_date = new Date();

    await this.xpEventModel.create({
      user_id: userId,
      event_type: XpEventType.CORRECT_ANSWER,
      xp_amount: GamificationService.XP_CORRECT_ANSWER,
      metadata: {
        consecutive_correct: state.consecutive_correct,
      },
    });

    await state.save();

    const flowState = this.calculateFlowState(state.consecutive_correct);

    this.eventEmitter.emit('gamification.correct_answer', {
      userId,
      xp: GamificationService.XP_CORRECT_ANSWER,
      consecutiveCorrect: state.consecutive_correct,
    });

    return {
      xp_earned: GamificationService.XP_CORRECT_ANSWER,
      total_xp: state.total_xp,
      streak: state.current_streak,
      flow_state: flowState,
      quest_progress: state.active_quests || [],
      league: state.current_league,
    };
  }

  /**
   * Process an incorrect answer: reset consecutive correct streak.
   */
  async processIncorrectAnswer(userId: string): Promise<FlowStateInfo> {
    const state = await this.getOrCreateState(userId);
    state.consecutive_correct = 0;
    state.last_activity_date = new Date();
    await state.save();

    return this.calculateFlowState(0);
  }

  /**
   * Flow State Design:
   * Gradually reduce confetti opacity and frequency as the user enters flow state
   * (5+ consecutive correct answers). This transitions from extrinsic motivation
   * (confetti/points) to intrinsic motivation (curiosity/story).
   */
  calculateFlowState(consecutiveCorrect: number): FlowStateInfo {
    const isInFlow = consecutiveCorrect >= GamificationService.FLOW_THRESHOLD;
    let opacity = 1.0;
    let frequency = 1.0;

    if (isInFlow) {
      const flowDepth =
        consecutiveCorrect - GamificationService.FLOW_THRESHOLD;
      opacity = Math.max(0.1, 1.0 - flowDepth * GamificationService.FLOW_FADE_RATE);
      frequency = Math.max(0.2, 1.0 - flowDepth * GamificationService.FLOW_FADE_RATE);
    }

    return {
      consecutive_correct: consecutiveCorrect,
      is_in_flow: isInFlow,
      confetti_opacity: opacity,
      confetti_frequency: frequency,
      show_confetti: !isInFlow || opacity > 0.1,
    };
  }

  /**
   * Process video completion XP.
   */
  async processVideoCompletion(userId: string): Promise<number> {
    const state = await this.getOrCreateState(userId);
    state.total_xp += GamificationService.XP_VIDEO_COMPLETION;
    state.weekly_xp += GamificationService.XP_VIDEO_COMPLETION;
    await state.save();

    await this.xpEventModel.create({
      user_id: userId,
      event_type: XpEventType.VIDEO_COMPLETION,
      xp_amount: GamificationService.XP_VIDEO_COMPLETION,
      metadata: {},
    });

    return state.total_xp;
  }

  /**
   * Use a streak freeze to prevent losing a streak.
   */
  async useStreakFreeze(userId: string): Promise<boolean> {
    const state = await this.getOrCreateState(userId);
    if (state.streak_freezes > 0) {
      state.streak_freezes -= 1;
      state.last_activity_date = new Date();
      await state.save();
      return true;
    }
    return false;
  }

  /**
   * Purchase a streak freeze with earned points.
   */
  async purchaseStreakFreeze(
    userId: string,
    cost = 100,
  ): Promise<{ success: boolean; remaining_xp: number }> {
    const state = await this.getOrCreateState(userId);
    if (state.total_xp >= cost) {
      state.total_xp -= cost;
      state.streak_freezes += 1;
      await state.save();
      return { success: true, remaining_xp: state.total_xp };
    }
    return { success: false, remaining_xp: state.total_xp };
  }
}
