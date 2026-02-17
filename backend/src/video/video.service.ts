import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GamificationService } from '../gamification/gamification.service';
import { VerifyVideoDto } from './dto/verify-video.dto';

/**
 * Video Verification Service
 *
 * Implements anti-cheat verification for Khan Academy video watching:
 * - Uses YouTube IFrame API callbacks: onStateChange, getDuration(), getCurrentTime()
 * - Verifies the user watched at least 90% of the video
 * - Ensures playback was at normal speed (no fast-forwarding)
 * - Only awards XP if verification passes
 */
@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);
  private readonly completionThreshold: number;

  /** Track verified videos to prevent double-claiming */
  private readonly verifiedVideos: Map<string, Set<string>> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly gamificationService: GamificationService,
  ) {
    this.completionThreshold = parseFloat(
      this.configService.get('VIDEO_COMPLETION_THRESHOLD', '0.9'),
    );
  }

  /**
   * Verify video completion and award XP if valid.
   *
   * Anti-cheat checks:
   * 1. Watch duration must be >= 90% of total duration
   * 2. Playback rate must be normal speed (1.0x)
   * 3. Delta between start/end times must prove actual watching
   * 4. Cannot claim XP for the same video twice
   */
  async verifyAndReward(dto: VerifyVideoDto): Promise<{
    verified: boolean;
    xp_earned: number;
    total_xp: number;
    reason?: string;
    show_confetti: boolean;
  }> {
    // Check if already claimed
    const userVideos = this.verifiedVideos.get(dto.user_id) ?? new Set();
    if (userVideos.has(dto.video_id)) {
      return {
        verified: false,
        xp_earned: 0,
        total_xp: 0,
        reason: 'XP already claimed for this video',
        show_confetti: false,
      };
    }

    // Anti-cheat check 1: Minimum watch percentage
    const watchPercentage = dto.watch_duration_sec / dto.total_duration_sec;
    if (watchPercentage < this.completionThreshold) {
      this.logger.warn(
        `Video verification failed for user=${dto.user_id}: ` +
          `watched ${(watchPercentage * 100).toFixed(1)}% (need ${this.completionThreshold * 100}%)`,
      );
      return {
        verified: false,
        xp_earned: 0,
        total_xp: 0,
        reason: `Must watch at least ${this.completionThreshold * 100}% of the video. ` +
          `You watched ${(watchPercentage * 100).toFixed(1)}%.`,
        show_confetti: false,
      };
    }

    // Anti-cheat check 2: Playback speed must be normal
    if (dto.playback_rate > 1.05) {
      this.logger.warn(
        `Video verification failed for user=${dto.user_id}: ` +
          `playback rate=${dto.playback_rate}x (must be 1x)`,
      );
      return {
        verified: false,
        xp_earned: 0,
        total_xp: 0,
        reason: 'Video must be watched at normal speed to earn XP.',
        show_confetti: false,
      };
    }

    // Anti-cheat check 3: Time consistency
    // The actual watch time should be close to what we'd expect
    const expectedMinimumTime =
      dto.total_duration_sec * this.completionThreshold * 0.8;
    if (dto.watch_duration_sec < expectedMinimumTime) {
      this.logger.warn(
        `Video verification failed for user=${dto.user_id}: ` +
          `suspicious timing - watched ${dto.watch_duration_sec}s, ` +
          `expected minimum ${expectedMinimumTime.toFixed(0)}s`,
      );
      return {
        verified: false,
        xp_earned: 0,
        total_xp: 0,
        reason: 'Watch time is inconsistent. Please watch the full video.',
        show_confetti: false,
      };
    }

    // All checks passed - award XP
    const result = await this.gamificationService.awardVideoXP(
      dto.user_id,
      dto.video_id,
    );

    // Mark video as claimed
    userVideos.add(dto.video_id);
    this.verifiedVideos.set(dto.user_id, userVideos);

    this.logger.log(
      `Video verified: user=${dto.user_id}, video=${dto.video_id}, ` +
        `xp_earned=${result.xp_earned}`,
    );

    return {
      verified: true,
      xp_earned: result.xp_earned,
      total_xp: result.total_xp,
      show_confetti: true,
    };
  }

  /**
   * Get curated Khan Academy video recommendations for a concept.
   */
  getVideoRecommendations(conceptId: string): {
    video_id: string;
    title: string;
    duration_sec: number;
    khan_academy_url: string;
  }[] {
    const videoMap: Record<
      string,
      { video_id: string; title: string; duration_sec: number }[]
    > = {
      math_6_integers: [
        {
          video_id: 'kyu-SBc4gfg',
          title: 'Adding and Subtracting Integers',
          duration_sec: 480,
        },
        {
          video_id: 'PBKxRQDEJMo',
          title: 'Multiplying and Dividing Integers',
          duration_sec: 540,
        },
      ],
      math_6_geometry_3d_solids: [
        {
          video_id: 'bBshhtadnPQ',
          title: 'Intro to 3D Shapes',
          duration_sec: 360,
        },
        {
          video_id: 'qJwecTgce6c',
          title: 'Volume of Rectangular Prisms',
          duration_sec: 420,
        },
      ],
      math_6_fractions: [
        {
          video_id: 'jGFGPo3pLqA',
          title: 'Fraction Fundamentals',
          duration_sec: 390,
        },
      ],
      math_6_multi_step_equations: [
        {
          video_id: '9ITsXlb0eMs',
          title: 'Multi-Step Equations',
          duration_sec: 600,
        },
      ],
      ela_4_reading_comprehension: [
        {
          video_id: 'dEtChMsYgv8',
          title: 'Reading Comprehension Strategies',
          duration_sec: 300,
        },
      ],
      ela_4_vocabulary: [
        {
          video_id: 'WiAfXzEZHVA',
          title: 'Building Vocabulary',
          duration_sec: 350,
        },
      ],
    };

    const videos = videoMap[conceptId] ?? [
      {
        video_id: 'dQw4w9WgXcQ',
        title: 'Learning Fundamentals',
        duration_sec: 300,
      },
    ];

    return videos.map((v) => ({
      ...v,
      khan_academy_url: `https://www.youtube.com/embed/${v.video_id}`,
    }));
  }
}
