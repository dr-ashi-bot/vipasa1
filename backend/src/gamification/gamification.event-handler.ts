import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LeagueService } from './league.service';
import { QuestService } from './quest.service';

/**
 * Asynchronous event handler for gamification events.
 * In production, this would consume events from Kafka/RabbitMQ.
 * Using NestJS EventEmitter as the local message broker equivalent.
 */
@Injectable()
export class GamificationEventHandler {
  private readonly logger = new Logger(GamificationEventHandler.name);

  constructor(
    private readonly leagueService: LeagueService,
    private readonly questService: QuestService,
  ) {}

  @OnEvent('gamification.correct_answer')
  async handleCorrectAnswer(payload: {
    userId: string;
    xp: number;
    consecutiveCorrect: number;
  }) {
    this.logger.log(
      `Processing correct answer event for user ${payload.userId}`,
    );
    await this.questService.updateQuestProgress(payload.userId, 'solve', 1);
    await this.leagueService.checkPromotion(payload.userId);
  }

  @OnEvent('gamification.video_completed')
  async handleVideoCompleted(payload: { userId: string; xp: number }) {
    this.logger.log(
      `Processing video completion event for user ${payload.userId}`,
    );
    await this.questService.updateQuestProgress(payload.userId, 'watch', 1);
  }

  @OnEvent('gamification.session_completed')
  async handleSessionCompleted(payload: {
    userId: string;
    duration_minutes: number;
  }) {
    this.logger.log(
      `Processing session completion event for user ${payload.userId}`,
    );
    await this.questService.updateQuestProgress(
      payload.userId,
      'session',
      1,
    );
  }
}
