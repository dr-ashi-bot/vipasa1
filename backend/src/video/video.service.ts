import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GamificationService } from '../gamification/gamification.service';

export interface VideoVerification {
  user_id: string;
  video_id: string;
  video_duration_sec: number;
  watch_duration_sec: number;
  start_time: number;
  end_time: number;
}

export interface VideoVerificationResult {
  verified: boolean;
  watch_percentage: number;
  xp_awarded: number;
  total_xp: number;
  reason?: string;
  show_confetti: boolean;
}

/**
 * Khan Academy Video Verification System
 *
 * Anti-cheat verification using YouTube IFrame API callbacks:
 * - onStateChange tracking
 * - getDuration() for total video length
 * - getCurrentTime() for actual watch position
 *
 * Only awards XP if user watched at least 90% of video at normal speed.
 */
@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);

  private static readonly MIN_WATCH_PERCENTAGE = 0.9;
  private static readonly MAX_SPEED_TOLERANCE = 1.15;

  constructor(
    private readonly gamificationService: GamificationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Curated Khan Academy video list mapped to curriculum concepts.
   */
  getVideoRecommendations(conceptId: string): Array<{
    video_id: string;
    title: string;
    khan_url: string;
    youtube_id: string;
    duration_sec: number;
  }> {
    const videoMap: Record<string, any[]> = {
      math_6_integer_ops: [
        {
          video_id: 'vid_int_ops_1',
          title: 'Adding & Subtracting Integers',
          khan_url: 'https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-negative-number-topic',
          youtube_id: 'iETmblMFNjQ',
          duration_sec: 480,
        },
      ],
      math_6_geometry_3d: [
        {
          video_id: 'vid_geo_3d_1',
          title: 'Volume of Rectangular Prisms',
          khan_url: 'https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-geometry-topic',
          youtube_id: 'qJwecTgce6c',
          duration_sec: 360,
        },
      ],
      math_6_equations: [
        {
          video_id: 'vid_equations_1',
          title: 'Solving Multi-Step Equations',
          khan_url: 'https://www.khanacademy.org/math/algebra-basics/alg-basics-linear-equations-and-inequalities',
          youtube_id: 'l3XzepN03KQ',
          duration_sec: 420,
        },
      ],
      math_6_ratios: [
        {
          video_id: 'vid_ratios_1',
          title: 'Intro to Ratios',
          khan_url: 'https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-ratios-prop-topic',
          youtube_id: 'HpdMJaKaXnA',
          duration_sec: 300,
        },
      ],
      ela_4_main_idea: [
        {
          video_id: 'vid_main_idea_1',
          title: 'Finding the Main Idea',
          khan_url: 'https://www.khanacademy.org/ela/cc-4th-reading-vocab',
          youtube_id: 'example_id',
          duration_sec: 240,
        },
      ],
    };

    return videoMap[conceptId] || [];
  }

  /**
   * Verify video completion using anti-cheat logic.
   *
   * The delta between start and end times must prove the user watched
   * at least 90% of the video at normal speed without skipping.
   */
  async verifyVideoCompletion(
    verification: VideoVerification,
  ): Promise<VideoVerificationResult> {
    const { user_id, video_id, video_duration_sec, watch_duration_sec, start_time, end_time } =
      verification;

    const wallClockDuration = end_time - start_time;
    const watchPercentage = watch_duration_sec / video_duration_sec;

    this.logger.log(
      `Video verification: user=${user_id}, video=${video_id}, ` +
        `watched=${watch_duration_sec}s/${video_duration_sec}s (${(watchPercentage * 100).toFixed(1)}%), ` +
        `wall_clock=${wallClockDuration}s`,
    );

    // Check 1: Did the user watch at least 90% of the video?
    if (watchPercentage < VideoService.MIN_WATCH_PERCENTAGE) {
      return {
        verified: false,
        watch_percentage: watchPercentage,
        xp_awarded: 0,
        total_xp: 0,
        reason: `Watched only ${(watchPercentage * 100).toFixed(1)}% — need at least 90%`,
        show_confetti: false,
      };
    }

    // Check 2: Was the video played at normal speed (no significant fast-forwarding)?
    // Wall clock time should be at least ~87% of watch duration (allowing 1.15x tolerance)
    const expectedMinWallClock =
      watch_duration_sec / VideoService.MAX_SPEED_TOLERANCE;
    if (wallClockDuration < expectedMinWallClock) {
      return {
        verified: false,
        watch_percentage: watchPercentage,
        xp_awarded: 0,
        total_xp: 0,
        reason: 'Video appears to have been watched at increased speed or skipped',
        show_confetti: false,
      };
    }

    // Check 3: Wall clock time shouldn't be unreasonably short
    if (wallClockDuration < video_duration_sec * 0.5) {
      return {
        verified: false,
        watch_percentage: watchPercentage,
        xp_awarded: 0,
        total_xp: 0,
        reason: 'Wall clock duration too short — possible skip detected',
        show_confetti: false,
      };
    }

    // Verification passed — award XP
    const totalXp = await this.gamificationService.processVideoCompletion(
      user_id,
    );

    this.eventEmitter.emit('gamification.video_completed', {
      userId: user_id,
      xp: 15,
      videoId: video_id,
    });

    this.logger.log(
      `Video ${video_id} verified for user ${user_id}. XP awarded!`,
    );

    return {
      verified: true,
      watch_percentage: watchPercentage,
      xp_awarded: 15,
      total_xp: totalXp,
      show_confetti: true,
    };
  }
}
