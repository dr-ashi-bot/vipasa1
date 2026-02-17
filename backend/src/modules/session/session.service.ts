import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LearningSessionEntity, SessionConfig } from './entities/learning-session.entity';
import { UserService } from '../user/user.service';
import { BKTEngine } from '../progress/bkt-engine.service';
import { v4 as uuidv4 } from 'uuid';

export interface StartSessionDto {
  user_id: string;
  session_duration_minutes?: number;
  visual_timer_type?: 'puppy' | 'gymnast';
}

export interface StartSessionResponse {
  session: LearningSessionEntity;
  recommended_concepts: string[];
  user_profile: any;
}

@Injectable()
export class SessionService {
  private readonly DEFAULT_SESSION_DURATION = 15;
  private readonly MAX_SESSION_DURATION = 30;
  private readonly MIN_SESSION_DURATION = 10;

  constructor(
    @InjectRepository(LearningSessionEntity)
    private sessionRepository: Repository<LearningSessionEntity>,
    private userService: UserService,
    private bktEngine: BKTEngine,
  ) {}

  /**
   * Start a new learning session
   * Implements Pomodoro-style focus blocks optimized for pre-teens
   */
  async startSession(dto: StartSessionDto): Promise<StartSessionResponse> {
    // Get user profile
    const userProfile = await this.userService.findById(dto.user_id);

    // Validate and set session duration
    let duration = dto.session_duration_minutes || this.DEFAULT_SESSION_DURATION;
    duration = Math.max(this.MIN_SESSION_DURATION, Math.min(this.MAX_SESSION_DURATION, duration));

    // Create session config
    const config: SessionConfig = {
      session_duration_minutes: duration,
      visual_timer_type: dto.visual_timer_type || 'puppy',
      enable_flow_state_detection: true,
    };

    // Calculate expiry time
    const now = new Date();
    const expiresAt = new Date(now.getTime() + duration * 60 * 1000);

    // Create session
    const session = this.sessionRepository.create({
      session_id: uuidv4(),
      user_id: dto.user_id,
      started_at: now,
      expires_at: expiresAt,
      config,
      questions_completed: 0,
      flow_state_achieved: false,
      correct_streak: 0,
    });

    await this.sessionRepository.save(session);

    // Get recommended concepts based on BKT
    const mathConcepts = await this.bktEngine.recommendConcepts(dto.user_id, 'math', 2);
    const elaConcepts = await this.bktEngine.recommendConcepts(dto.user_id, 'ela', 1);
    const recommended_concepts = [...mathConcepts, ...elaConcepts];

    return {
      session,
      recommended_concepts,
      user_profile: userProfile,
    };
  }

  /**
   * Get active session for user
   */
  async getActiveSession(user_id: string): Promise<LearningSessionEntity | null> {
    const now = new Date();

    const session = await this.sessionRepository.findOne({
      where: {
        user_id,
      },
      order: {
        started_at: 'DESC',
      },
    });

    if (!session) {
      return null;
    }

    // Check if session has expired
    if (session.expires_at < now) {
      return null;
    }

    return session;
  }

  /**
   * Update session progress
   */
  async updateSessionProgress(
    session_id: string,
    is_correct: boolean,
  ): Promise<LearningSessionEntity> {
    const session = await this.sessionRepository.findOne({
      where: { session_id },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    session.questions_completed += 1;

    if (is_correct) {
      session.correct_streak += 1;

      // Detect flow state (5+ correct in a row)
      if (session.correct_streak >= 5) {
        session.flow_state_achieved = true;
      }
    } else {
      session.correct_streak = 0;
    }

    return this.sessionRepository.save(session);
  }

  /**
   * End session
   */
  async endSession(session_id: string): Promise<{
    questions_completed: number;
    flow_state_achieved: boolean;
    duration_minutes: number;
  }> {
    const session = await this.sessionRepository.findOne({
      where: { session_id },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const now = new Date();
    const durationMs = now.getTime() - session.started_at.getTime();
    const durationMinutes = Math.round(durationMs / 60000);

    return {
      questions_completed: session.questions_completed,
      flow_state_achieved: session.flow_state_achieved,
      duration_minutes: durationMinutes,
    };
  }

  /**
   * Check if session has expired (implements Zeigarnik Effect)
   */
  async checkSessionExpiry(session_id: string): Promise<{
    expired: boolean;
    remaining_seconds: number;
  }> {
    const session = await this.sessionRepository.findOne({
      where: { session_id },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const now = new Date();
    const remaining_ms = session.expires_at.getTime() - now.getTime();
    const remaining_seconds = Math.max(0, Math.floor(remaining_ms / 1000));

    return {
      expired: remaining_seconds === 0,
      remaining_seconds,
    };
  }
}
