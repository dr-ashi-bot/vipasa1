import { Body, Controller, NotFoundException, Post } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserProfile } from "../entities/user-profile.entity";
import { GenerateContentDto } from "./dto/generate-content.dto";
import { StartSessionDto } from "./dto/start-session.dto";
import { SubmitProgressDto } from "./dto/submit-progress.dto";
import { VideoVerifyDto } from "./dto/video-verify.dto";
import { AiTutorService } from "./services/ai-tutor.service";
import { BktService } from "./services/bkt.service";
import { CurriculumService } from "./services/curriculum.service";
import { GamificationService } from "./services/gamification.service";
import { RabbitMqService } from "./services/rabbitmq.service";
import { SessionService } from "./services/session.service";
import { VectorMemoryService } from "./services/vector-memory.service";
import { VideoVerificationService } from "./services/video-verification.service";

@Controller()
export class LearningController {
  constructor(
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    private readonly sessionService: SessionService,
    private readonly curriculumService: CurriculumService,
    private readonly bktService: BktService,
    private readonly aiTutorService: AiTutorService,
    private readonly vectorMemoryService: VectorMemoryService,
    private readonly rabbitMqService: RabbitMqService,
    private readonly gamificationService: GamificationService,
    private readonly videoVerificationService: VideoVerificationService,
  ) {}

  @Post("session/start")
  async startSession(@Body() payload: StartSessionDto): Promise<unknown> {
    const user = await this.resolveOrCreateUser(payload.user_id);
    const session = this.sessionService.startSession(user.user_id, payload.preferred_visual_theme);
    const masterySnapshot = await this.bktService.getMasterySnapshot(user.user_id);
    const curriculum = this.curriculumService.buildPlan(masterySnapshot);
    const gamification = await this.gamificationService.getDashboard(user.user_id);

    return {
      user_profile: user,
      session,
      visual_timer: {
        style: session.visual_theme,
        description:
          session.visual_theme === "puppy-walk"
            ? "A puppy walks toward a finish flag as focus time elapses."
            : "A gymnast progresses through a routine as focus time elapses.",
        uses_numeric_countdown: false,
      },
      optimal_learning_path: curriculum,
      gamification,
    };
  }

  @Post("content/generate")
  async generateContent(@Body() payload: GenerateContentDto): Promise<unknown> {
    this.sessionService.assertActive(payload.session_id);
    const user = await this.userProfileRepository.findOne({ where: { user_id: payload.user_id } });
    if (!user) {
      throw new NotFoundException(`No user profile found for id "${payload.user_id}".`);
    }

    const memorySnippets = await this.vectorMemoryService.findRelevantMemories(
      user.user_id,
      `${payload.track}:${payload.concept_id}`,
      4,
    );

    const generated = await this.aiTutorService.generateProblem({
      userName: user.first_name,
      interests: user.thematic_interests,
      conceptId: payload.concept_id,
      track: payload.track,
      memorySnippets,
    });

    await this.vectorMemoryService.storeMemory(
      user.user_id,
      `Generated ${payload.track} content for ${payload.concept_id}.`,
      {
        kind: "generated_content",
        track: payload.track,
        concept_id: payload.concept_id,
      },
    );

    return {
      user_id: user.user_id,
      concept_id: payload.concept_id,
      track: payload.track,
      content: generated,
      constraints: {
        math_level_target: 6,
        ela_level_target: 4,
        persona_injection: {
          user_name: user.first_name,
          interests: user.thematic_interests,
        },
      },
    };
  }

  @Post("progress/submit")
  async submitProgress(@Body() payload: SubmitProgressDto): Promise<unknown> {
    this.sessionService.assertActive(payload.session_id);
    const user = await this.userProfileRepository.findOne({ where: { user_id: payload.user_id } });
    if (!user) {
      throw new NotFoundException(`No user profile found for id "${payload.user_id}".`);
    }

    const mastery = await this.bktService.updateMastery(
      payload.user_id,
      payload.concept_id,
      payload.track,
      payload.is_correct,
    );

    const xp_delta = this.calculateXp(payload.is_correct, payload.response_time_sec);
    const submitted_at = new Date().toISOString();
    await this.rabbitMqService.publishProgress({
      user_id: payload.user_id,
      concept_id: payload.concept_id,
      track: payload.track,
      is_correct: payload.is_correct,
      response_time_sec: payload.response_time_sec,
      xp_delta,
      submitted_at,
    });

    let socratic_question: string | null = null;
    if (!payload.is_correct) {
      const misconceptions = await this.vectorMemoryService.findRecentMisconceptions(
        payload.user_id,
        payload.concept_id,
      );
      socratic_question = await this.aiTutorService.generateSingleSocraticQuestion({
        userName: user.first_name,
        conceptId: payload.concept_id,
        track: payload.track,
        learnerResponse: payload.learner_response,
        misconceptionSnippets: misconceptions,
      });
      await this.vectorMemoryService.storeMemory(
        payload.user_id,
        `Misconception on ${payload.concept_id}: ${payload.learner_response ?? "no response text"}`,
        {
          kind: "misconception",
          track: payload.track,
          concept_id: payload.concept_id,
        },
      );
    } else {
      await this.vectorMemoryService.storeMemory(
        payload.user_id,
        `Successful solve on ${payload.concept_id}.`,
        {
          kind: "success",
          track: payload.track,
          concept_id: payload.concept_id,
        },
      );
    }

    const flowState = await this.gamificationService.getFlowState(payload.user_id);
    return {
      mastery_update: mastery,
      xp_awarded: xp_delta,
      confetti: {
        trigger: payload.is_correct,
        opacity: flowState.confetti_opacity,
        frequency: flowState.confetti_frequency,
      },
      socratic_feedback: socratic_question,
    };
  }

  @Post("video/verify")
  async verifyVideo(@Body() payload: VideoVerifyDto): Promise<unknown> {
    const verification = this.videoVerificationService.verify(payload);
    const submitted_at = new Date().toISOString();
    await this.rabbitMqService.publishVideo({
      user_id: payload.user_id,
      video_id: payload.video_id,
      verified: verification.verified,
      xp_delta: verification.xp_delta,
      completion_ratio: verification.completion_ratio,
      submitted_at,
    });

    const flowState = await this.gamificationService.getFlowState(payload.user_id);
    return {
      ...verification,
      confetti: verification.verified
        ? {
            trigger: true,
            opacity: flowState.confetti_opacity,
            frequency: flowState.confetti_frequency,
          }
        : { trigger: false, opacity: 0, frequency: 0 },
    };
  }

  private async resolveOrCreateUser(userId?: string): Promise<UserProfile> {
    if (userId) {
      const existing = await this.userProfileRepository.findOne({ where: { user_id: userId } });
      if (existing) {
        return existing;
      }
      return this.userProfileRepository.save(
        this.userProfileRepository.create({
          user_id: userId,
          first_name: "Ashi",
          thematic_interests: ["gymnastics", "cute puppies"],
          math_level: 6,
          ela_level: 4,
        }),
      );
    }

    return this.userProfileRepository.save(
      this.userProfileRepository.create({
        first_name: "Ashi",
        thematic_interests: ["gymnastics", "cute puppies"],
        math_level: 6,
        ela_level: 4,
      }),
    );
  }

  private calculateXp(isCorrect: boolean, responseTimeSec: number): number {
    if (!isCorrect) {
      return 0;
    }
    const baseXp = 20;
    if (responseTimeSec <= 10) return baseXp + 15;
    if (responseTimeSec <= 20) return baseXp + 8;
    if (responseTimeSec <= 30) return baseXp + 4;
    return baseXp;
  }
}
