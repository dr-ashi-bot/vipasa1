import { Injectable } from '@nestjs/common';

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'time_bound' | 'monthly';
  target: number;
  unit: string;
  xpReward: number;
  expiresAt: Date;
}

@Injectable()
export class QuestService {
  getTimeBoundQuests(): Quest[] {
    const now = new Date();
    return [
      {
        id: 'tb_5_in_3',
        title: 'Speed Solve',
        description: 'Solve 5 problems in 3 minutes',
        type: 'time_bound',
        target: 5,
        unit: 'problems',
        xpReward: 50,
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      },
      {
        id: 'tb_10_correct',
        title: 'Perfect Ten',
        description: 'Get 10 correct answers in a row',
        type: 'time_bound',
        target: 10,
        unit: 'correct',
        xpReward: 75,
        expiresAt: new Date(now.getTime() + 48 * 60 * 60 * 1000),
      },
    ];
  }

  getMonthlyQuest(): Quest {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const now = new Date();
    const monthName = months[now.getMonth()];
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    return {
      id: `monthly_${now.getFullYear()}_${now.getMonth()}`,
      title: `${monthName} Quest`,
      description: 'Complete 50 problems this month',
      type: 'monthly',
      target: 50,
      unit: 'problems',
      xpReward: 200,
      expiresAt: nextMonth,
    };
  }

  getAllQuests(): Quest[] {
    return [
      ...this.getTimeBoundQuests(),
      this.getMonthlyQuest(),
    ];
  }
}
