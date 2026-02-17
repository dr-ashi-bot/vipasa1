import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { QuestService } from './quest.service';
import { LeagueTier } from '../schemas/gamification-state.schema';

@Controller('api/gamification')
export class GamificationController {
  constructor(
    private gamificationService: GamificationService,
    private questService: QuestService,
  ) {}

  @Get('state')
  async getState(@Query('user_id') userId: string) {
    const state = await this.gamificationService.getOrCreateState(userId);
    const { promoteCount, demoteCount } =
      this.gamificationService.getPromotionDemotionZones(state.current_league);
    return {
      current_streak: state.current_streak,
      streak_freezes: state.streak_freezes,
      total_xp: state.total_xp,
      current_league: state.current_league,
      weekly_xp: state.weekly_xp,
      promotion_zone_top: promoteCount,
      demotion_zone_bottom: demoteCount,
    };
  }

  @Post('streak-freeze')
  async purchaseStreakFreeze(@Body() dto: { user_id: string }) {
    const success = await this.gamificationService.purchaseStreakFreeze(
      dto.user_id,
    );
    return { success };
  }

  @Get('leaderboard')
  async getLeaderboard(
    @Query('user_id') userId: string,
    @Query('league') league?: LeagueTier,
  ) {
    const state = await this.gamificationService.getOrCreateState(userId);
    const leagueTier = (league as LeagueTier) ?? state.current_league;
    const leaderboard = await this.gamificationService.getLeagueLeaderboard(
      userId,
      leagueTier,
    );
    return { leaderboard, league: leagueTier };
  }

  @Get('quests')
  async getQuests() {
    return this.questService.getAllQuests();
  }
}
