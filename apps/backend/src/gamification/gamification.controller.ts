import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { IsUUID } from 'class-validator';
import { PurchaseStreakFreezeDto } from './dto/purchase-streak-freeze.dto';
import { GamificationService } from './gamification.service';

class GamificationStateQueryDto {
  @IsUUID()
  user_id!: string;
}

@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamification: GamificationService) {}

  @Get('state')
  async state(@Query() q: GamificationStateQueryDto) {
    const state = await this.gamification.getOrCreateState(q.user_id);
    return {
      state,
      quests: this.gamification.getActiveQuests(),
      leaderboard: this.gamification.getWeeklyLeaderboardCohort(q.user_id, state.total_xp),
    };
  }

  @Post('streak-freeze/purchase')
  async purchase(@Body() dto: PurchaseStreakFreezeDto) {
    return await this.gamification.purchaseStreakFreeze(dto.user_id, dto.cost_xp ?? 200);
  }
}

