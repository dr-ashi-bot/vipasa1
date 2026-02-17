import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GamificationService } from './gamification.service';
import { SubmitProgressDto } from '../bkt/dto/submit-progress.dto';
import { BKTService } from '../bkt/bkt.service';

@ApiTags('Progress & Gamification')
@Controller('api/progress')
export class GamificationController {
  constructor(
    private readonly gamificationService: GamificationService,
    private readonly bktService: BKTService,
  ) {}

  /**
   * POST /api/progress/submit
   * Receives is_correct boolean. Updates BKT PostgreSQL table
   * and emits async event to update MongoDB gamification states.
   */
  @Post('submit')
  @ApiOperation({
    summary: 'Submit answer and update progress',
    description:
      'Updates BKT mastery in PostgreSQL and asynchronously updates ' +
      'gamification state (XP, streaks, confetti) in MongoDB. ' +
      'Returns confetti settings with flow-state opacity adjustment.',
  })
  @ApiResponse({
    status: 201,
    description: 'Progress updated with gamification response',
  })
  async submitProgress(@Body() dto: SubmitProgressDto) {
    // Update BKT mastery (PostgreSQL)
    const mastery = await this.bktService.updateMastery(
      dto.user_id,
      dto.concept_id,
      dto.is_correct,
    );

    let gamificationResult;

    if (dto.is_correct) {
      // Award XP and calculate confetti (MongoDB via async event)
      gamificationResult =
        await this.gamificationService.handleCorrectAnswer(
          dto.user_id,
          dto.concept_id,
        );
    } else {
      // Reset flow state on incorrect answer
      await this.gamificationService.handleIncorrectAnswer(dto.user_id);

      gamificationResult = {
        xp_earned: 0,
        total_xp: 0,
        consecutive_correct: 0,
        confetti_opacity: 1.0,
        confetti_frequency: 1.0,
        show_confetti: false,
        streak: 0,
      };
    }

    return {
      mastery: {
        concept_id: dto.concept_id,
        probability_known: mastery.probability_known,
        is_mastered: this.bktService.isMastered(mastery),
        total_attempts: mastery.total_attempts,
        correct_attempts: mastery.correct_attempts,
      },
      gamification: gamificationResult,
    };
  }

  /**
   * GET /api/progress/leaderboard/:userId
   */
  @Get('leaderboard/:userId')
  @ApiOperation({ summary: 'Get weekly leaderboard for user cohort' })
  async getLeaderboard(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.gamificationService.getLeaderboard(userId);
  }

  /**
   * GET /api/progress/state/:userId
   */
  @Get('state/:userId')
  @ApiOperation({ summary: 'Get gamification state for user' })
  async getState(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.gamificationService.getOrCreateState(userId);
  }

  /**
   * POST /api/progress/streak-freeze/:userId
   */
  @Post('streak-freeze/:userId')
  @ApiOperation({ summary: 'Purchase a streak freeze with XP' })
  async purchaseStreakFreeze(
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.gamificationService.purchaseStreakFreeze(userId);
  }
}
