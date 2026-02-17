import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { BktService } from '../bkt/bkt.service';
import { ContentService } from '../content/content.service';
import { GamificationService } from '../gamification/gamification.service';
import { ProgressService } from '../progress/progress.service';
import { SessionService } from '../session/session.service';
import { UserProfileService } from '../users/user-profile.service';
import { VideoService } from '../video/video.service';
import { GenerateContentDto } from './dto/generate-content.dto';
import { PurchaseStreakFreezeDto } from './dto/purchase-streak-freeze.dto';
import { StartSessionDto } from './dto/start-session.dto';
import { SubmitProgressDto } from './dto/submit-progress.dto';
import { VerifyVideoDto } from './dto/verify-video.dto';

@Controller('api')
export class ApiController {
  constructor(
    private readonly userProfileService: UserProfileService,
    private readonly sessionService: SessionService,
    private readonly bktService: BktService,
    private readonly contentService: ContentService,
    private readonly progressService: ProgressService,
    private readonly videoService: VideoService,
    private readonly gamificationService: GamificationService,
  ) {}

  @Post('session/start')
  startSession(@Body() payload: StartSessionDto): {
    user_profile: {
      user_id: string;
      first_name: string;
      thematic_interests: string[];
      math_level: number;
      ela_level: number;
    };
    session_timer: {
      session_id: string;
      focus_block_min: number;
      started_at: string;
      expires_at: string;
      visual_mode: 'puppy-walk' | 'gymnast-routine';
      progress_ratio: number;
      is_expired: boolean;
    };
    optimal_learning_path: ReturnType<BktService['getOptimalLearningPath']>;
    quests: ReturnType<GamificationService['getActiveQuests']>;
  } {
    const profile = this.userProfileService.getOrCreateProfile(payload.user_id);
    const sessionTimer = this.sessionService.startSession(
      profile.user_id,
      payload.focus_block_min,
      profile.thematic_interests,
    );

    return {
      user_profile: profile,
      session_timer: sessionTimer,
      optimal_learning_path: this.bktService.getOptimalLearningPath(profile.user_id),
      quests: this.gamificationService.getActiveQuests(),
    };
  }

  @Post('content/generate')
  generateContent(@Body() payload: GenerateContentDto): ReturnType<ContentService['generateContent']> {
    return this.contentService.generateContent(payload);
  }

  @Post('progress/submit')
  submitProgress(@Body() payload: SubmitProgressDto): ReturnType<ProgressService['submitProgress']> {
    return this.progressService.submitProgress(payload);
  }

  @Post('video/verify')
  verifyVideo(@Body() payload: VerifyVideoDto): ReturnType<VideoService['verifyCompletion']> {
    return this.videoService.verifyCompletion(payload);
  }

  @Post('gamification/streak-freeze/purchase')
  purchaseStreakFreeze(
    @Body() payload: PurchaseStreakFreezeDto,
  ): ReturnType<GamificationService['purchaseStreakFreeze']> {
    return this.gamificationService.purchaseStreakFreeze(payload.user_id);
  }

  @Get('gamification/state/:user_id')
  getGamificationState(@Param('user_id') userId: string): {
    state: ReturnType<GamificationService['getState']>;
    league: ReturnType<GamificationService['buildLeagueBoard']>;
    quests: ReturnType<GamificationService['getActiveQuests']>;
  } {
    return {
      state: this.gamificationService.getState(userId),
      league: this.gamificationService.buildLeagueBoard(userId),
      quests: this.gamificationService.getActiveQuests(),
    };
  }
}
