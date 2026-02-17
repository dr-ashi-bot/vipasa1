import { ForbiddenException, Injectable } from '@nestjs/common';
import { GenerateContentDto } from '../api/dto/generate-content.dto';
import { BktService } from '../bkt/bkt.service';
import { SubjectTrack } from '../domain/enums/subject-track.enum';
import { SessionService } from '../session/session.service';
import { TutorService } from '../tutor/tutor.service';
import { UserProfileService } from '../users/user-profile.service';
import { VectorMemoryService } from '../vector/vector-memory.service';

@Injectable()
export class ContentService {
  constructor(
    private readonly userProfileService: UserProfileService,
    private readonly sessionService: SessionService,
    private readonly bktService: BktService,
    private readonly vectorMemoryService: VectorMemoryService,
    private readonly tutorService: TutorService,
  ) {}

  async generateContent(payload: GenerateContentDto): Promise<{
    user_id: string;
    track: SubjectTrack;
    concept_id: string;
    lexile_target: string;
    content: {
      title: string;
      story_intro: string;
      prompt: string;
      story_cliffhanger: string;
      expected_answer_format: string;
    };
    timer: {
      session_id: string;
      focus_block_min: number;
      started_at: string;
      expires_at: string;
      visual_mode: 'puppy-walk' | 'gymnast-routine';
      progress_ratio: number;
      is_expired: boolean;
    };
  }> {
    if (!this.sessionService.canReceiveNewContent(payload.user_id)) {
      throw new ForbiddenException(
        'Session has ended. Save your curiosity for tomorrow to keep focus healthy.',
      );
    }

    const userProfile = this.userProfileService.getProfileOrThrow(payload.user_id);
    const concept =
      this.bktService.getConceptBlueprint(payload.concept_id, payload.track);
    const misconceptions = await this.vectorMemoryService.queryMemories(
      payload.user_id,
      `${payload.track} ${payload.concept_id} misconception`,
      3,
    );

    const problem = await this.tutorService.generateAdaptiveProblem({
      profile: userProfile,
      subject: payload.track,
      concept_id: payload.concept_id,
      concept_blueprint: concept,
      prior_misconceptions: misconceptions.map((item) => item.text),
    });
    const timer = this.sessionService.getVisualTimer(payload.user_id);
    if (!timer) {
      throw new ForbiddenException('No active session found.');
    }

    await this.vectorMemoryService.storeMemory({
      user_id: payload.user_id,
      text: `Presented ${payload.track} content for ${payload.concept_id}.`,
      metadata: {
        subject: payload.track,
        concept_id: payload.concept_id,
        event: 'content_generation',
      },
    });

    return {
      user_id: payload.user_id,
      track: payload.track,
      concept_id: payload.concept_id,
      lexile_target: payload.track === SubjectTrack.ELA ? 'Grade 4' : 'Grade 6+',
      content: problem,
      timer,
    };
  }
}
