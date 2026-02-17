import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { BKTService } from '../bkt/bkt.service';
import { GamificationService } from '../gamification/gamification.service';
import { StartSessionDto } from './dto/start-session.dto';
import { v4 as uuidv4 } from 'uuid';

interface ActiveSession {
  session_id: string;
  user_id: string;
  started_at: Date;
  expires_at: Date;
  duration_minutes: number;
  is_active: boolean;
  problems_completed: number;
}

/**
 * Session Management Service
 *
 * Implements neuroscience-based session boundaries:
 * - Immutable 15-20 minute focus blocks for pre-teens
 * - Visual timer (puppy walking / gymnast performing) - data sent to frontend
 * - Zeigarnik Effect: cuts off content at timer expiry to drive return
 */
@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly activeSessions: Map<string, ActiveSession> = new Map();
  private readonly defaultDuration: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly bktService: BKTService,
    private readonly gamificationService: GamificationService,
  ) {
    this.defaultDuration = parseInt(
      this.configService.get('SESSION_DURATION_MINUTES', '15'),
      10,
    );
  }

  /**
   * Start a new learning session.
   * Initializes the visual timer and queries BKT for optimal learning path.
   */
  async startSession(dto: StartSessionDto): Promise<{
    session_id: string;
    duration_minutes: number;
    expires_at: string;
    learning_path: {
      math_next: { concept_id: string; mastery: number } | null;
      ela_next: { concept_id: string; mastery: number } | null;
    };
    visual_timer: {
      type: string;
      theme: string;
      total_seconds: number;
    };
    streak_info: {
      current_streak: number;
      streak_freezes: number;
      streak_restored: boolean;
    };
    quests: Record<string, unknown>;
  }> {
    const user = await this.userService.findById(dto.user_id);
    const duration = dto.duration_minutes ?? this.defaultDuration;

    // Check for existing active session
    const existing = this.activeSessions.get(dto.user_id);
    if (existing && existing.is_active && existing.expires_at > new Date()) {
      throw new BadRequestException(
        'An active session is already running. Complete it first or wait for it to expire.',
      );
    }

    const sessionId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + duration * 60 * 1000);

    // Create session
    const session: ActiveSession = {
      session_id: sessionId,
      user_id: dto.user_id,
      started_at: now,
      expires_at: expiresAt,
      duration_minutes: duration,
      is_active: true,
      problems_completed: 0,
    };
    this.activeSessions.set(dto.user_id, session);

    // Seed concepts if needed, then get optimal learning path
    await this.bktService.seedConceptsForUser(
      dto.user_id,
      user.math_level,
      user.ela_level,
    );

    const mathNext = await this.bktService.getOptimalNextConcept(
      dto.user_id,
      'math',
    );
    const elaNext = await this.bktService.getOptimalNextConcept(
      dto.user_id,
      'ela',
    );

    // Update streak
    const streakInfo = await this.gamificationService.updateStreak(dto.user_id);

    // Generate daily quests
    const quests = await this.gamificationService.generateDailyQuests(
      dto.user_id,
    );

    // Choose visual timer theme based on user interests
    const timerTheme = user.thematic_interests.includes('gymnastics')
      ? 'gymnast_routine'
      : 'puppy_walk';

    this.logger.log(
      `Session started: id=${sessionId}, user=${dto.user_id}, duration=${duration}min`,
    );

    return {
      session_id: sessionId,
      duration_minutes: duration,
      expires_at: expiresAt.toISOString(),
      learning_path: {
        math_next: mathNext
          ? {
              concept_id: mathNext.concept_id,
              mastery: mathNext.probability_known,
            }
          : null,
        ela_next: elaNext
          ? {
              concept_id: elaNext.concept_id,
              mastery: elaNext.probability_known,
            }
          : null,
      },
      visual_timer: {
        type: 'animated_progress',
        theme: timerTheme,
        total_seconds: duration * 60,
      },
      streak_info: streakInfo,
      quests,
    };
  }

  /**
   * Check if a session is still active (Zeigarnik Effect enforcement).
   * Once expired, no new content should be served.
   */
  isSessionActive(userId: string): boolean {
    const session = this.activeSessions.get(userId);
    if (!session) return false;
    if (!session.is_active) return false;
    if (session.expires_at <= new Date()) {
      session.is_active = false;
      return false;
    }
    return true;
  }

  /**
   * Get remaining time in the active session.
   */
  getRemainingTime(userId: string): {
    remaining_seconds: number;
    progress_fraction: number;
    is_expired: boolean;
  } {
    const session = this.activeSessions.get(userId);
    if (!session) {
      return { remaining_seconds: 0, progress_fraction: 1, is_expired: true };
    }

    const now = new Date();
    const remainingMs = session.expires_at.getTime() - now.getTime();
    const totalMs = session.duration_minutes * 60 * 1000;

    if (remainingMs <= 0) {
      session.is_active = false;
      return { remaining_seconds: 0, progress_fraction: 1, is_expired: true };
    }

    return {
      remaining_seconds: Math.ceil(remainingMs / 1000),
      progress_fraction: 1 - remainingMs / totalMs,
      is_expired: false,
    };
  }

  /**
   * End a session and record completion stats.
   */
  async endSession(
    userId: string,
  ): Promise<{ problems_completed: number; session_xp: number }> {
    const session = this.activeSessions.get(userId);
    if (!session) {
      return { problems_completed: 0, session_xp: 0 };
    }

    session.is_active = false;
    await this.userService.incrementSessionCount(userId);

    this.logger.log(
      `Session ended: user=${userId}, problems=${session.problems_completed}`,
    );

    return {
      problems_completed: session.problems_completed,
      session_xp: 15,
    };
  }

  /**
   * Record a problem completion in the current session.
   */
  recordProblemCompleted(userId: string): void {
    const session = this.activeSessions.get(userId);
    if (session && session.is_active) {
      session.problems_completed += 1;
    }
  }
}
