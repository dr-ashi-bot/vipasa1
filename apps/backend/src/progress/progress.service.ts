import { ForbiddenException, Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiTutorService } from '../ai/ai-tutor.service';
import { BktService } from '../bkt/bkt.service';
import { GeneratedContentEntity } from '../db/postgres/generated-content.entity';
import { SessionService } from '../session/session.service';
import { UserService } from '../user/user.service';
import { VectorMemoryService } from '../infra/vector/vector-memory.service';

function normalizeText(s: string): string {
  return s.trim().toLowerCase();
}

function isNumeric(s: string): boolean {
  return /^-?\d+(\.\d+)?$/.test(s.trim());
}

function grade(expected: string, actual?: string): boolean | null {
  if (actual == null) return null;
  const e = expected.trim();
  const a = actual.trim();
  if (isNumeric(e) && isNumeric(a)) {
    const en = Number(e);
    const an = Number(a);
    return Number.isFinite(en) && Number.isFinite(an) && Math.abs(en - an) < 1e-9;
  }
  return normalizeText(e) === normalizeText(a);
}

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(GeneratedContentEntity)
    private readonly generatedRepo: Repository<GeneratedContentEntity>,
    private readonly sessions: SessionService,
    private readonly users: UserService,
    private readonly bkt: BktService,
    private readonly tutor: AiTutorService,
    private readonly memory: VectorMemoryService,
    private readonly amqp: AmqpConnection,
  ) {}

  async submit(input: {
    user_id: string;
    session_id: string;
    content_id?: string;
    concept_id: string;
    is_correct: boolean;
    user_answer?: string;
    response_time_ms?: number;
  }) {
    const user = await this.users.getOrCreateUser(input.user_id);
    const session = await this.sessions.getSession(input.session_id);
    if (session.user_id !== user.user_id) throw new ForbiddenException('session mismatch');

    let expected_answer: string | null = null;
    let question_text: string | null = null;
    const track = input.concept_id.startsWith('ela_') ? 'ela' : 'math';

    if (input.content_id) {
      const content = await this.generatedRepo.findOne({ where: { content_id: input.content_id } });
      if (content && content.user_id === user.user_id && content.session_id === session.session_id) {
        expected_answer = content.expected_answer;
        question_text = content.question_text;
      }
    }

    const computed = expected_answer ? grade(expected_answer, input.user_answer) : null;
    const is_correct = computed ?? input.is_correct;

    const mastery = await this.bkt.applyObservation({
      user_id: user.user_id,
      concept_id: input.concept_id,
      is_correct,
    });

    // Store memory for RAG: especially misconceptions.
    const memoryText = is_correct
      ? `${user.first_name} got it right on ${input.concept_id}.`
      : `${user.first_name} got it wrong on ${input.concept_id}. Their answer was "${input.user_answer ?? 'N/A'}".`;
    await this.memory.addMemory({
      user_id: user.user_id,
      text: memoryText,
      metadata: {
        concept_id: input.concept_id,
        track,
        is_correct,
        response_time_ms: input.response_time_ms ?? null,
      },
    });

    const xp_delta = is_correct ? 10 : 0;
    const exchange = process.env.RABBITMQ_EXCHANGE ?? 'vipasa.events';
    await this.amqp.publish(exchange, 'progress.submitted', {
      user_id: user.user_id,
      concept_id: input.concept_id,
      track,
      is_correct,
      xp_delta,
      response_time_ms: input.response_time_ms ?? null,
      occurred_at: new Date().toISOString(),
    });

    let socratic_question: string | null = null;
    if (!is_correct) {
      const memories = await this.memory.queryMemories({
        user_id: user.user_id,
        query: `mistake ${input.concept_id}`,
        limit: 5,
      });
      socratic_question = await this.tutor.generateSocraticQuestion({
        user,
        concept_id: input.concept_id,
        track,
        question_text: question_text ?? '(question not stored)',
        user_answer: input.user_answer,
        memory_snippets: memories.map((m) => m.text),
      });
    }

    return {
      is_correct,
      xp_delta,
      confetti: is_correct,
      bkt: {
        concept_id: input.concept_id,
        probability_known: mastery.probability_known,
      },
      socratic_question,
    };
  }
}

