import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { GamificationService } from './gamification.service';

@Injectable()
export class GamificationConsumer {
  private readonly logger = new Logger(GamificationConsumer.name);

  constructor(private readonly gamification: GamificationService) {}

  @RabbitSubscribe({
    exchange: process.env.RABBITMQ_EXCHANGE ?? 'vipasa.events',
    routingKey: 'progress.submitted',
    queue: 'vipasa.gamification.progress',
  })
  async onProgressSubmitted(msg: {
    user_id: string;
    concept_id: string;
    track: 'math' | 'ela';
    is_correct: boolean;
    xp_delta: number;
    response_time_ms?: number | null;
    occurred_at: string;
  }) {
    try {
      await this.gamification.applyXpEvent({
        user_id: msg.user_id,
        event_type: 'progress.submitted',
        xp_delta: msg.xp_delta,
        occurred_at: msg.occurred_at,
        is_correct: msg.is_correct,
        response_time_ms: msg.response_time_ms ?? null,
        payload: msg,
      });
    } catch (err) {
      this.logger.error(`Failed to apply progress event: ${String(err)}`);
      throw err;
    }
  }

  @RabbitSubscribe({
    exchange: process.env.RABBITMQ_EXCHANGE ?? 'vipasa.events',
    routingKey: 'video.verified',
    queue: 'vipasa.gamification.video',
  })
  async onVideoVerified(msg: {
    user_id: string;
    video_id: string;
    verified: boolean;
    xp_delta: number;
    occurred_at: string;
  }) {
    if (!msg.verified) return;
    try {
      await this.gamification.applyXpEvent({
        user_id: msg.user_id,
        event_type: 'video.verified',
        xp_delta: msg.xp_delta,
        occurred_at: msg.occurred_at,
        payload: msg,
      });
    } catch (err) {
      this.logger.error(`Failed to apply video event: ${String(err)}`);
      throw err;
    }
  }
}

