import { Injectable } from '@nestjs/common';
import { SubmitProgressDto } from '../api/dto/submit-progress.dto';
import { BktService } from '../bkt/bkt.service';
import { GamificationEventsPublisher } from '../gamification/gamification-events.publisher';
import { GamificationService } from '../gamification/gamification.service';
import { SessionService } from '../session/session.service';
import { TutorService } from '../tutor/tutor.service';
import { VectorMemoryService } from '../vector/vector-memory.service';

@Injectable()
export class ProgressService {
  constructor(
    private readonly bktService: BktService,
    private readonly sessionService: SessionService,
    private readonly vectorMemoryService: VectorMemoryService,
    private readonly tutorService: TutorService,
    private readonly gamificationService: GamificationService,
    private readonly gamificationEventsPublisher: GamificationEventsPublisher,
  ) {}

  async submitProgress(payload: SubmitProgressDto): Promise<{
    session_expired: boolean;
    zeigarnik_prompt?: string;
    mastery?: {
      mastery_id: string;
      probability_known: number;
      opportunities: number;
      subject: string;
      concept_id: string;
    };
    socratic_question?: string;
    gamification?: ReturnType<GamificationService['applyProgressEvent']>;
  }> {
    if (!this.sessionService.canReceiveNewContent(payload.user_id)) {
      return {
        session_expired: true,
        zeigarnik_prompt:
          'Nice effort today. Pause now and come back tomorrow to discover what happens next in Ashi and Mochi’s story.',
      };
    }

    const mastery = this.bktService.updateMastery(
      payload.user_id,
      payload.track,
      payload.concept_id,
      payload.is_correct,
    );

    const event = {
      user_id: payload.user_id,
      concept_id: payload.concept_id,
      track: payload.track,
      is_correct: payload.is_correct,
      response_time_ms: payload.response_time_ms ?? 30_000,
      occurred_at: new Date().toISOString(),
    };

    // Event emission updates the async gamification pipeline through RabbitMQ.
    void this.gamificationEventsPublisher.publishProgressSubmitted(event);
    const gamification = this.gamificationService.applyProgressEvent(event);

    const misconceptionHistory = await this.vectorMemoryService.queryMemories(
      payload.user_id,
      `${payload.track} ${payload.concept_id} mistake`,
      4,
    );

    await this.vectorMemoryService.storeMemory({
      user_id: payload.user_id,
      text: payload.is_correct
        ? `Correct response on ${payload.concept_id}.`
        : `Incorrect response on ${payload.concept_id}: ${payload.learner_response ?? 'no text supplied'}`,
      metadata: {
        event: 'progress_submission',
        concept_id: payload.concept_id,
        track: payload.track,
        is_correct: payload.is_correct,
      },
    });

    const socraticQuestion =
      payload.is_correct
        ? undefined
        : await this.tutorService.generateSocraticQuestion({
            subject: payload.track,
            concept_id: payload.concept_id,
            learner_response: payload.learner_response ?? '',
            misconception_memory: misconceptionHistory.map((item) => item.text),
          });

    return {
      session_expired: false,
      mastery: {
        mastery_id: mastery.mastery_id,
        probability_known: mastery.probability_known,
        opportunities: mastery.opportunities,
        subject: mastery.subject,
        concept_id: mastery.concept_id,
      },
      socratic_question: socraticQuestion,
      gamification,
    };
  }
}
