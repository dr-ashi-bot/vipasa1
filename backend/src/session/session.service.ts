import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BktService } from '../bkt/bkt.service';
import { SubjectTrack } from '../database/bkt-mastery.entity';
import { GamificationService } from '../gamification/gamification.service';
import { QuestService } from '../gamification/quest.service';
import { ContentService, GeneratedContent } from '../content/content.service';

export interface SessionConfig {
  session_id: string;
  user_id: string;
  duration_minutes: number;
  visual_timer_theme: 'puppy_walk' | 'gymnast_routine';
  started_at: string;
  expires_at: string;
  learning_path: LearningPathItem[];
  is_active: boolean;
}

export interface LearningPathItem {
  concept_id: string;
  subject: SubjectTrack;
  concept_name: string;
  mastery: number;
  content?: GeneratedContent;
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  /**
   * Session duration: 15-20 minute focus blocks for pre-teens.
   * Using 18 minutes as the default sweet spot.
   */
  private static readonly DEFAULT_DURATION_MINUTES = 18;
  private static readonly MIN_DURATION = 15;
  private static readonly MAX_DURATION = 20;

  private activeSessions = new Map<string, SessionConfig>();

  constructor(
    private readonly bktService: BktService,
    private readonly gamificationService: GamificationService,
    private readonly questService: QuestService,
    private readonly contentService: ContentService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Start a new learning session.
   *
   * 1. Initialize the visual Pomodoro timer (puppy walking / gymnast routine)
   * 2. Query BKT engine for optimal learning path
   * 3. Pre-generate first content item
   * 4. Assign daily quests if needed
   */
  async startSession(
    userId: string,
    preferredTrack?: SubjectTrack,
    durationMinutes?: number,
  ): Promise<SessionConfig> {
    const duration = Math.min(
      Math.max(
        durationMinutes || SessionService.DEFAULT_DURATION_MINUTES,
        SessionService.MIN_DURATION,
      ),
      SessionService.MAX_DURATION,
    );

    await this.bktService.initializeMasteryForUser(userId);

    const mathConcept = await this.bktService.getOptimalNextConcept(
      userId,
      SubjectTrack.MATH,
    );
    const elaConcept = await this.bktService.getOptimalNextConcept(
      userId,
      SubjectTrack.ELA,
    );

    const learningPath: LearningPathItem[] = [];

    if (mathConcept) {
      const mathMasteries = await this.bktService.getUserMasteries(
        userId,
        SubjectTrack.MATH,
      );
      const mathMastery = mathMasteries.find(
        (m) => m.concept_id === mathConcept.concept_id,
      );

      let content: GeneratedContent | undefined;
      try {
        content = await this.contentService.generateContent(
          userId,
          mathConcept.concept_id,
        );
      } catch (e) {
        this.logger.warn(`Content generation failed: ${e.message}`);
      }

      learningPath.push({
        concept_id: mathConcept.concept_id,
        subject: SubjectTrack.MATH,
        concept_name: mathConcept.name,
        mastery: mathMastery?.probability_known ?? 0.1,
        content,
      });
    }

    if (elaConcept) {
      const elaMasteries = await this.bktService.getUserMasteries(
        userId,
        SubjectTrack.ELA,
      );
      const elaMastery = elaMasteries.find(
        (m) => m.concept_id === elaConcept.concept_id,
      );

      let content: GeneratedContent | undefined;
      try {
        content = await this.contentService.generateContent(
          userId,
          elaConcept.concept_id,
        );
      } catch (e) {
        this.logger.warn(`Content generation failed: ${e.message}`);
      }

      learningPath.push({
        concept_id: elaConcept.concept_id,
        subject: SubjectTrack.ELA,
        concept_name: elaConcept.name,
        mastery: elaMastery?.probability_known ?? 0.1,
        content,
      });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + duration * 60 * 1000);

    const sessionConfig: SessionConfig = {
      session_id: `session_${userId}_${Date.now()}`,
      user_id: userId,
      duration_minutes: duration,
      visual_timer_theme: Math.random() > 0.5 ? 'puppy_walk' : 'gymnast_routine',
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      learning_path: learningPath,
      is_active: true,
    };

    this.activeSessions.set(sessionConfig.session_id, sessionConfig);

    await this.questService.assignQuests(userId);

    this.logger.log(
      `Session started for user ${userId}: ${duration}min, ${learningPath.length} concepts`,
    );

    return sessionConfig;
  }

  /**
   * Check if a session is still active (timer not expired).
   * Implements the Zeigarnik Effect: when timer expires, immediately
   * cut off new content to create desire to return tomorrow.
   */
  isSessionActive(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    const now = new Date();
    const expires = new Date(session.expires_at);

    if (now >= expires) {
      session.is_active = false;
      this.logger.log(
        `Session ${sessionId} expired — Zeigarnik Effect triggered. No new content.`,
      );
      return false;
    }

    return true;
  }

  /**
   * End a session and emit completion event.
   */
  async endSession(sessionId: string): Promise<{ completed: boolean; duration_minutes: number }> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return { completed: false, duration_minutes: 0 };
    }

    session.is_active = false;
    const startedAt = new Date(session.started_at);
    const endedAt = new Date();
    const actualDuration =
      (endedAt.getTime() - startedAt.getTime()) / (1000 * 60);

    this.eventEmitter.emit('gamification.session_completed', {
      userId: session.user_id,
      duration_minutes: Math.round(actualDuration),
    });

    this.activeSessions.delete(sessionId);

    return {
      completed: true,
      duration_minutes: Math.round(actualDuration),
    };
  }

  /**
   * Get remaining time for the visual timer.
   * Returns progress as a 0-1 float for the animated timer (puppy walk / gymnast routine).
   */
  getTimerProgress(sessionId: string): {
    remaining_seconds: number;
    progress: number;
    theme: string;
    is_expired: boolean;
  } {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return {
        remaining_seconds: 0,
        progress: 1,
        theme: 'puppy_walk',
        is_expired: true,
      };
    }

    const now = new Date();
    const started = new Date(session.started_at);
    const expires = new Date(session.expires_at);
    const totalDuration = expires.getTime() - started.getTime();
    const elapsed = now.getTime() - started.getTime();
    const remaining = Math.max(0, expires.getTime() - now.getTime());

    return {
      remaining_seconds: Math.round(remaining / 1000),
      progress: Math.min(elapsed / totalDuration, 1),
      theme: session.visual_timer_theme,
      is_expired: remaining <= 0,
    };
  }
}
