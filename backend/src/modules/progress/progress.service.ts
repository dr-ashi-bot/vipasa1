import { Injectable } from '@nestjs/common';
import { BKTEngine } from './bkt-engine.service';
import { GamificationService } from '../gamification/gamification.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';

export interface ProgressSubmissionDto {
  user_id: string;
  session_id: string;
  content_id: string;
  concept_id: string;
  is_correct: boolean;
  time_taken_seconds: number;
  answer_given: string;
}

export interface ProgressResponseDto {
  xp_awarded: number;
  mastery_updated: boolean;
  new_probability: number;
  trigger_confetti: boolean;
  confetti_opacity: number;
  streak_updated: boolean;
  new_streak: number;
  mastery_achieved: boolean;
}

@Injectable()
export class ProgressService {
  constructor(
    private bktEngine: BKTEngine,
    private gamificationService: GamificationService,
    private rabbitMQService: RabbitMQService,
  ) {}

  async submitProgress(submission: ProgressSubmissionDto): Promise<ProgressResponseDto> {
    // Update BKT mastery
    const updatedMastery = await this.bktEngine.updateMastery(
      submission.user_id,
      submission.concept_id,
      submission.is_correct,
    );

    const mastery_achieved = this.bktEngine.hasMastered(updatedMastery.probability_known);

    // Award XP and update gamification state
    let xp_awarded = 0;
    let trigger_confetti = false;
    let confetti_opacity = 1.0;
    let streak_updated = false;
    let new_streak = 0;

    if (submission.is_correct) {
      const gamificationUpdate = await this.gamificationService.awardXP(
        submission.user_id,
        10,
        'correct_answer',
      );

      xp_awarded = gamificationUpdate.xp_awarded;
      trigger_confetti = gamificationUpdate.trigger_confetti;
      confetti_opacity = gamificationUpdate.confetti_opacity;
      streak_updated = true;
      new_streak = gamificationUpdate.new_streak;

      // Publish event to RabbitMQ for async processing
      await this.rabbitMQService.publishGamificationEvent({
        type: 'correct_answer',
        user_id: submission.user_id,
        xp_awarded,
        data: {
          concept_id: submission.concept_id,
          time_taken: submission.time_taken_seconds,
        },
      });
    }

    return {
      xp_awarded,
      mastery_updated: true,
      new_probability: updatedMastery.probability_known,
      trigger_confetti,
      confetti_opacity,
      streak_updated,
      new_streak,
      mastery_achieved,
    };
  }

  async getUserMasteryStats(user_id: string) {
    const masteryRecords = await this.bktEngine.getUserMastery(user_id);

    const mathConcepts = masteryRecords.filter((m) => m.concept_id.startsWith('math'));
    const elaConcepts = masteryRecords.filter((m) => m.concept_id.startsWith('ela'));

    const mathMastered = mathConcepts.filter((m) =>
      this.bktEngine.hasMastered(m.probability_known),
    ).length;
    const elaMastered = elaConcepts.filter((m) =>
      this.bktEngine.hasMastered(m.probability_known),
    ).length;

    return {
      total_concepts: masteryRecords.length,
      math: {
        total: mathConcepts.length,
        mastered: mathMastered,
        average_probability: this.calculateAverage(mathConcepts.map((m) => m.probability_known)),
      },
      ela: {
        total: elaConcepts.length,
        mastered: elaMastered,
        average_probability: this.calculateAverage(elaConcepts.map((m) => m.probability_known)),
      },
    };
  }

  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }
}
