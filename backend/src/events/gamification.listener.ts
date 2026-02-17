import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { GamificationService } from '../gamification/gamification.service';
import { RabbitMqPublisher } from './rabbitmq.publisher';
import { ProgressSubmittedEvent } from './gamification.events';

const XP_PER_CORRECT = 10;

@Injectable()
export class GamificationListener {
  constructor(
    private gamificationService: GamificationService,
    private rabbitMq: RabbitMqPublisher,
  ) {}

  @OnEvent('progress.submitted')
  async handleProgressSubmitted(event: ProgressSubmittedEvent) {
    if (event.isCorrect) {
      await this.gamificationService.awardXp(
        event.userId,
        XP_PER_CORRECT,
        event.correctInRow,
      );
    }
    await this.rabbitMq.publish({
      type: 'progress.submitted',
      payload: event,
    });
  }
}
