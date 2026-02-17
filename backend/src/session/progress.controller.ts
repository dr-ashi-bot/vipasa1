import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BktService } from '../bkt/bkt.service';
import { GamificationService } from '../gamification/gamification.service';
import { ContentService } from '../content/content.service';
import { SessionService } from './session.service';
import {
  ProgressSubmission,
  ProgressResult,
} from '../common/interfaces/progress.interface';

class SubmitProgressDto {
  user_id: string;
  concept_id: string;
  session_id?: string;
  is_correct: boolean;
  user_answer?: string;
  correct_answer?: string;
  question?: string;
  time_taken_seconds?: number;
}

@ApiTags('progress')
@Controller('api/progress')
export class ProgressController {
  constructor(
    private readonly bktService: BktService,
    private readonly gamificationService: GamificationService,
    private readonly contentService: ContentService,
    private readonly sessionService: SessionService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * POST /api/progress/submit
   *
   * Receives is_correct boolean.
   * 1. Updates BKT PostgreSQL table.
   * 2. Emits an asynchronous event (Kafka/RabbitMQ equivalent) to update
   *    MongoDB gamification states.
   * 3. If incorrect, generates Socratic feedback via RAG pipeline.
   * 4. If correct, returns gamification rewards + flow state.
   */
  @Post('submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Submit answer progress — updates BKT & emits gamification events',
  })
  @ApiBody({ type: SubmitProgressDto })
  async submitProgress(
    @Body() body: SubmitProgressDto,
  ): Promise<ProgressResult> {
    if (!body.user_id || !body.concept_id || body.is_correct === undefined) {
      throw new BadRequestException(
        'user_id, concept_id, and is_correct are required',
      );
    }

    // Check session validity (Zeigarnik Effect: block if expired)
    if (body.session_id) {
      const sessionActive = this.sessionService.isSessionActive(
        body.session_id,
      );
      if (!sessionActive) {
        throw new BadRequestException(
          'Session has expired. Great work today! Come back tomorrow to continue the story. 🌟',
        );
      }
    }

    // Step 1: Get current mastery before update
    const currentMasteries = await this.bktService.getUserMasteries(
      body.user_id,
    );
    const currentMastery = currentMasteries.find(
      (m) => m.concept_id === body.concept_id,
    );
    const previousMastery = currentMastery?.probability_known ?? 0.1;

    // Step 2: Update BKT mastery (PostgreSQL)
    const updatedMastery = await this.bktService.updateMastery(
      body.user_id,
      body.concept_id,
      body.is_correct,
    );

    // Step 3: Process gamification (emits async event to MongoDB)
    let gamificationResult;
    if (body.is_correct) {
      gamificationResult =
        await this.gamificationService.processCorrectAnswer(body.user_id);
    } else {
      const flowState =
        await this.gamificationService.processIncorrectAnswer(body.user_id);
      gamificationResult = {
        xp_earned: 0,
        total_xp: (await this.gamificationService.getOrCreateState(body.user_id))
          .total_xp,
        streak: (await this.gamificationService.getOrCreateState(body.user_id))
          .current_streak,
        flow_state: flowState,
        league: (await this.gamificationService.getOrCreateState(body.user_id))
          .current_league,
      };
    }

    // Step 4: Generate feedback/next content
    let feedback;
    let nextContent;

    if (!body.is_correct && body.user_answer && body.correct_answer && body.question) {
      feedback = await this.contentService.generateSocraticResponse(
        body.user_id,
        body.concept_id,
        body.user_answer,
        body.correct_answer,
        body.question,
      );
    }

    if (body.is_correct) {
      try {
        nextContent = await this.contentService.generateContent(
          body.user_id,
          body.concept_id,
        );
      } catch (e) {
        // Content generation is non-critical
      }
    }

    return {
      mastery_update: {
        concept_id: body.concept_id,
        subject: updatedMastery.subject_track,
        previous_mastery: previousMastery,
        new_mastery: updatedMastery.probability_known,
      },
      gamification: {
        xp_earned: gamificationResult.xp_earned || 0,
        total_xp: gamificationResult.total_xp,
        streak: gamificationResult.streak,
        league: gamificationResult.league,
        flow_state:
          gamificationResult.flow_state ||
          this.gamificationService.calculateFlowState(0),
      },
      feedback,
      next_content: nextContent,
    };
  }
}
