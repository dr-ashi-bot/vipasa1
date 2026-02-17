import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { LeagueService } from './league.service';

@Controller('gamification')
export class GamificationController {
  constructor(
    private readonly gamificationService: GamificationService,
    private readonly leagueService: LeagueService,
  ) {}

  @Get('state/:user_id')
  async getUserState(@Param('user_id') user_id: string) {
    return this.gamificationService.getUserState(user_id);
  }

  @Get('leaderboard')
  async getLeaderboard() {
    return this.gamificationService.getWeeklyLeaderboard(30);
  }

  @Get('league/:user_id')
  async getLeagueStanding(@Param('user_id') user_id: string) {
    return this.leagueService.getUserLeagueStanding(user_id);
  }

  @Post('streak-freeze/use')
  async useStreakFreeze(@Body('user_id') user_id: string) {
    const success = await this.gamificationService.useStreakFreeze(user_id);
    return { success };
  }

  @Post('streak-freeze/purchase')
  async purchaseStreakFreeze(@Body('user_id') user_id: string) {
    const success = await this.gamificationService.purchaseStreakFreeze(user_id, 100);
    return { success };
  }

  @Post('admin/process-leagues')
  async processLeagues() {
    const result = await this.leagueService.processWeeklyLeagueUpdates();
    return result;
  }
}
