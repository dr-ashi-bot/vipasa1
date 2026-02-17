import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiTutorService } from '../ai/ai-tutor.service';
import { GeneratedContentEntity } from '../db/postgres/generated-content.entity';
import { SessionService } from '../session/session.service';
import { UserService } from '../user/user.service';
import { VectorMemoryService } from '../infra/vector/vector-memory.service';

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(GeneratedContentEntity)
    private readonly generatedRepo: Repository<GeneratedContentEntity>,
    private readonly sessions: SessionService,
    private readonly users: UserService,
    private readonly tutor: AiTutorService,
    private readonly memory: VectorMemoryService,
  ) {}

  async generate(input: { user_id: string; session_id: string; concept_id: string }) {
    const user = await this.users.getOrCreateUser(input.user_id);
    const session = await this.sessions.getSession(input.session_id);
    if (session.user_id !== user.user_id) throw new ForbiddenException('session mismatch');
    if (this.sessions.isExpired(session)) {
      return {
        session_complete: true,
        message:
          'Great work today. Your focus time is done. Come back tomorrow to see what happens next in the story.',
      };
    }

    const track = input.concept_id.startsWith('ela_') ? 'ela' : 'math';
    const memories = await this.memory.queryMemories({
      user_id: user.user_id,
      query: `${track}:${input.concept_id}`,
      limit: 5,
    });

    const item = await this.tutor.generateItem({
      user,
      track,
      concept_id: input.concept_id,
      memory_snippets: memories.map((m) => m.text),
    });

    const saved = await this.generatedRepo.save(
      this.generatedRepo.create({
        session_id: session.session_id,
        user_id: user.user_id,
        concept_id: input.concept_id,
        track,
        prompt: item.prompt,
        question_text: item.question_text,
        expected_answer: item.expected_answer,
        metadata: {
          story_part: item.story_part,
          input_mode: item.input_mode,
          choices: item.choices ?? null,
        },
      }),
    );

    return {
      content_id: saved.content_id,
      track,
      concept_id: input.concept_id,
      story_part: item.story_part,
      question_text: item.question_text,
      input_mode: item.input_mode,
      choices: item.choices ?? undefined,
    };
  }
}

