import { Injectable } from '@nestjs/common';
import { VerifyVideoDto } from '../api/dto/verify-video.dto';
import { GamificationService } from '../gamification/gamification.service';
import { VectorMemoryService } from '../vector/vector-memory.service';

@Injectable()
export class VideoService {
  constructor(
    private readonly gamificationService: GamificationService,
    private readonly vectorMemoryService: VectorMemoryService,
  ) {}

  async verifyCompletion(payload: VerifyVideoDto): Promise<{
    verified: boolean;
    reason: string;
    xp_awarded: number;
    should_trigger_confetti: boolean;
    gamification_state: ReturnType<GamificationService['getState']>;
  }> {
    const duration = payload.video_duration_sec ?? 0;
    const playbackRate = payload.playback_rate ?? 1;
    const didSeek = payload.did_seek ?? false;

    if (duration <= 0) {
      return {
        verified: false,
        reason:
          'Video duration is required for anti-cheat validation (getDuration callback).',
        xp_awarded: 0,
        should_trigger_confetti: false,
        gamification_state: this.gamificationService.getState(payload.user_id),
      };
    }

    const watchedRatio = payload.watch_duration_sec / duration;
    const watchedEnough = watchedRatio >= 0.9;
    const isNormalSpeed = Math.abs(playbackRate - 1) <= 0.05;
    const verified = watchedEnough && isNormalSpeed && !didSeek;

    if (!verified) {
      return {
        verified: false,
        reason:
          'Reward denied: must watch >= 90%, at normal speed, without skipping.',
        xp_awarded: 0,
        should_trigger_confetti: false,
        gamification_state: this.gamificationService.getState(payload.user_id),
      };
    }

    const reward = this.gamificationService.awardVideoCompletionXp(payload.user_id, 100);
    await this.vectorMemoryService.storeMemory({
      user_id: payload.user_id,
      text: `Verified Khan-style video completion for ${payload.video_id}.`,
      metadata: {
        event: 'video_verification',
        video_id: payload.video_id,
        watched_ratio: Number(watchedRatio.toFixed(4)),
      },
    });

    return {
      verified: true,
      reason: 'Verified through YouTube callbacks and anti-skip checks.',
      xp_awarded: reward.xp_earned,
      should_trigger_confetti: reward.should_confetti,
      gamification_state: reward.state,
    };
  }
}
