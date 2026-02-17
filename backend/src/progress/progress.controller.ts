import { Body, Controller, Post } from '@nestjs/common';
import { BktService } from '../bkt/bkt.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MemoryService } from '../memory/memory.service';
import { ProgressSubmittedEvent } from '../events/gamification.events';

class SubmitProgressDto {
  user_id: string;
  concept_id: string;
  is_correct: boolean;
  user_answer?: string;
  problem?: string;
  correct_in_row?: number;
}

@Controller('api/progress')
export class ProgressController {
  constructor(
    private bktService: BktService,
    private eventEmitter: EventEmitter2,
    private memoryService: MemoryService,
  ) {}

  @Post('submit')
  async submit(@Body() dto: SubmitProgressDto) {
    const probabilityKnown = await this.bktService.updateMastery(
      dto.user_id,
      dto.concept_id,
      dto.is_correct,
    );

    this.eventEmitter.emit(
      'progress.submitted',
      new ProgressSubmittedEvent(
        dto.user_id,
        dto.is_correct,
        dto.concept_id,
        dto.correct_in_row ?? (dto.is_correct ? 1 : 0),
      ),
    );

    if (!dto.is_correct && dto.user_answer && dto.problem) {
      await this.memoryService.add({
        user_id: dto.user_id,
        type: 'misconception',
        content: `Answered "${dto.user_answer}" to "${dto.problem}"`,
        metadata: { concept_id: dto.concept_id },
      });
    }

    return {
      probability_known: probabilityKnown,
      message: dto.is_correct
        ? 'Mastery updated. XP awarded asynchronously.'
        : 'Mastery updated. Consider Socratic feedback.',
    };
  }
}
