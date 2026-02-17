import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GamificationState } from '../database/gamification-state.schema';
import { v4 as uuidv4 } from 'uuid';

export interface Quest {
  quest_id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  expires_at: Date;
  type: 'daily' | 'monthly';
  action_type: string;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

@Injectable()
export class QuestService {
  private readonly logger = new Logger(QuestService.name);

  constructor(
    @InjectModel(GamificationState.name)
    private readonly gamificationModel: Model<GamificationState>,
  ) {}

  /**
   * Generate daily time-bound quests.
   */
  generateDailyQuests(): Quest[] {
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return [
      {
        quest_id: uuidv4(),
        title: 'Speed Solver',
        description: 'Solve 5 problems in 3 minutes',
        target: 5,
        progress: 0,
        expires_at: endOfDay,
        type: 'daily',
        action_type: 'solve',
      },
      {
        quest_id: uuidv4(),
        title: 'Knowledge Seeker',
        description: 'Watch 2 educational videos',
        target: 2,
        progress: 0,
        expires_at: endOfDay,
        type: 'daily',
        action_type: 'watch',
      },
      {
        quest_id: uuidv4(),
        title: 'Focus Champion',
        description: 'Complete 3 focus sessions',
        target: 3,
        progress: 0,
        expires_at: endOfDay,
        type: 'daily',
        action_type: 'session',
      },
    ];
  }

  /**
   * Generate monthly quest with generic month-based title.
   */
  generateMonthlyQuest(): Quest {
    const now = new Date();
    const monthName = MONTH_NAMES[now.getMonth()];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    return {
      quest_id: uuidv4(),
      title: `${monthName} Quest`,
      description: `Complete 100 problems this ${monthName}`,
      target: 100,
      progress: 0,
      expires_at: endOfMonth,
      type: 'monthly',
      action_type: 'solve',
    };
  }

  /**
   * Assign quests to a user.
   */
  async assignQuests(userId: string): Promise<Quest[]> {
    const state = await this.gamificationModel.findOne({ user_id: userId });
    if (!state) return [];

    const dailyQuests = this.generateDailyQuests();
    const monthlyQuest = this.generateMonthlyQuest();
    const allQuests = [...dailyQuests, monthlyQuest];

    const hasMonthly = state.active_quests?.some(
      (q) => q.type === 'monthly' && new Date(q.expires_at) > new Date(),
    );

    const newQuests = hasMonthly
      ? dailyQuests
      : allQuests;

    state.active_quests = [
      ...(state.active_quests?.filter(
        (q) => new Date(q.expires_at) > new Date(),
      ) || []),
      ...newQuests.map((q) => ({
        quest_id: q.quest_id,
        title: q.title,
        target: q.target,
        progress: 0,
        expires_at: q.expires_at,
        type: q.type as 'daily' | 'monthly',
      })),
    ];

    await state.save();
    return allQuests;
  }

  /**
   * Update quest progress for a user.
   */
  async updateQuestProgress(
    userId: string,
    actionType: string,
    amount: number,
  ): Promise<void> {
    const state = await this.gamificationModel.findOne({ user_id: userId });
    if (!state || !state.active_quests) return;

    let modified = false;
    for (const quest of state.active_quests) {
      if (new Date(quest.expires_at) < new Date()) continue;

      const questDef = this.getQuestDefinition(quest.title);
      if (questDef?.action_type === actionType) {
        quest.progress = Math.min(quest.progress + amount, quest.target);
        modified = true;

        if (quest.progress >= quest.target) {
          this.logger.log(
            `Quest "${quest.title}" completed for user ${userId}!`,
          );
        }
      }
    }

    if (modified) await state.save();
  }

  private getQuestDefinition(
    title: string,
  ): { action_type: string } | null {
    const defs: Record<string, { action_type: string }> = {
      'Speed Solver': { action_type: 'solve' },
      'Knowledge Seeker': { action_type: 'watch' },
      'Focus Champion': { action_type: 'session' },
    };

    if (title.endsWith('Quest')) {
      return { action_type: 'solve' };
    }

    return defs[title] || null;
  }
}
