import { Injectable } from '@nestjs/common';
import { GamificationService } from '../gamification/gamification.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';

export interface VideoVerificationDto {
  user_id: string;
  video_id: string;
  watch_duration_sec: number;
  video_duration_sec: number;
  playback_rate?: number;
}

export interface VideoVerificationResponse {
  verified: boolean;
  xp_awarded: number;
  completion_percentage: number;
  trigger_confetti: boolean;
  confetti_opacity: number;
  reason?: string;
}

@Injectable()
export class VideoService {
  private readonly COMPLETION_THRESHOLD = 0.9; // 90%
  private readonly MIN_WATCH_DURATION = 30; // 30 seconds
  private readonly XP_REWARD = 20;

  constructor(
    private gamificationService: GamificationService,
    private rabbitMQService: RabbitMQService,
  ) {}

  /**
   * Verify video completion with anti-cheat measures
   * Ensures user watched at least 90% of the video at normal speed
   */
  async verifyVideoCompletion(dto: VideoVerificationDto): Promise<VideoVerificationResponse> {
    const completion_percentage = dto.watch_duration_sec / dto.video_duration_sec;
    const playback_rate = dto.playback_rate || 1.0;

    // Anti-cheat checks
    let verified = true;
    let reason: string | undefined;

    // Check 1: Minimum watch duration
    if (dto.watch_duration_sec < this.MIN_WATCH_DURATION) {
      verified = false;
      reason = 'Video too short or skipped';
    }

    // Check 2: Completion threshold
    if (completion_percentage < this.COMPLETION_THRESHOLD) {
      verified = false;
      reason = `Only watched ${Math.round(completion_percentage * 100)}% of the video`;
    }

    // Check 3: Playback speed check (prevent fast-forwarding)
    if (playback_rate > 1.2) {
      verified = false;
      reason = 'Video played too fast';
    }

    // Check 4: Duration sanity check (prevent manipulation)
    if (dto.watch_duration_sec > dto.video_duration_sec * 1.1) {
      verified = false;
      reason = 'Invalid watch duration';
    }

    let xp_awarded = 0;
    let trigger_confetti = false;
    let confetti_opacity = 0;

    if (verified) {
      // Award XP for video completion
      const gamificationUpdate = await this.gamificationService.awardXP(
        dto.user_id,
        this.XP_REWARD,
        'video_completed',
      );

      xp_awarded = gamificationUpdate.xp_awarded;
      trigger_confetti = gamificationUpdate.trigger_confetti;
      confetti_opacity = gamificationUpdate.confetti_opacity;

      // Publish event to RabbitMQ
      await this.rabbitMQService.publishGamificationEvent({
        type: 'video_completed',
        user_id: dto.user_id,
        xp_awarded,
        data: {
          video_id: dto.video_id,
          completion_percentage,
        },
      });
    }

    return {
      verified,
      xp_awarded,
      completion_percentage,
      trigger_confetti,
      confetti_opacity,
      reason,
    };
  }

  /**
   * Get Khan Academy recommended videos for a concept
   */
  async getRecommendedVideos(concept_id: string): Promise<
    Array<{
      video_id: string;
      title: string;
      duration_sec: number;
      thumbnail_url: string;
    }>
  > {
    // In production, this would query Khan Academy API or a database
    // For now, return mock data
    return [
      {
        video_id: 'dQw4w9WgXcQ',
        title: `Introduction to ${concept_id}`,
        duration_sec: 300,
        thumbnail_url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      },
    ];
  }
}
