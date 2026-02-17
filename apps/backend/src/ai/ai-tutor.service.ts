import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { UserProfileEntity } from '../db/postgres/user-profile.entity';

export type Track = 'math' | 'ela';

export interface GeneratedItem {
  prompt: string;
  track: Track;
  concept_id: string;
  story_part: string;
  question_text: string;
  input_mode: 'short_text' | 'multiple_choice';
  choices?: string[];
  expected_answer: string;
}

@Injectable()
export class AiTutorService {
  private readonly logger = new Logger(AiTutorService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly openai: OpenAI,
  ) {}

  async generateItem(input: {
    user: UserProfileEntity;
    track: Track;
    concept_id: string;
    memory_snippets: string[];
  }): Promise<GeneratedItem> {
    const hasKey = Boolean(this.config.get<string>('OPENAI_API_KEY'));
    if (!hasKey) return this.generateDeterministicItem(input);

    try {
      return await this.generateWithOpenAi(input);
    } catch (err) {
      this.logger.warn(`OpenAI generation failed; using deterministic (${String(err)})`);
      return this.generateDeterministicItem(input);
    }
  }

  async generateSocraticQuestion(input: {
    user: UserProfileEntity;
    concept_id: string;
    track: Track;
    question_text: string;
    user_answer?: string;
    memory_snippets: string[];
  }): Promise<string> {
    const hasKey = Boolean(this.config.get<string>('OPENAI_API_KEY'));
    if (!hasKey) return this.generateDeterministicSocraticQuestion(input);

    const model = this.config.get<string>('OPENAI_MODEL', 'gpt-4o');
    const interests = input.user.thematic_interests?.join(', ') || 'gymnastics, cute puppies';
    const memoryBlock = input.memory_snippets.length
      ? `Past mistakes/preferences (for context):\n- ${input.memory_snippets.join('\n- ')}`
      : 'No prior memory found.';

    const system = [
      'You are an empathetic Socratic tutor for a pre-teen learner.',
      'Never reveal the answer.',
      'Ask EXACTLY ONE guiding question (one sentence, ending with "?").',
      'Keep language simple (about 4th–5th grade reading level).',
    ].join(' ');

    const user = [
      `Student: ${input.user.first_name}. Interests: ${interests}.`,
      `Concept: ${input.concept_id} (${input.track}).`,
      `Question: ${input.question_text}`,
      `Student answer: ${input.user_answer ?? '(not provided)'}`,
      memoryBlock,
      'Return only one Socratic question.',
    ].join('\n');

    const resp = await this.openai.chat.completions.create({
      model,
      temperature: 0.4,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });

    const text = (resp.choices?.[0]?.message?.content || '').trim();
    return this.forceSingleQuestion(text || this.generateDeterministicSocraticQuestion(input));
  }

  private forceSingleQuestion(text: string): string {
    const qIndex = text.indexOf('?');
    if (qIndex === -1) return `${text.replace(/[.!]+$/g, '').trim()}?`;
    return text.slice(0, qIndex + 1).split('\n')[0].trim();
  }

  private generateDeterministicSocraticQuestion(input: {
    user: UserProfileEntity;
    concept_id: string;
    track: Track;
    user_answer?: string;
  }): string {
    if (input.track === 'math') {
      if (input.concept_id.includes('volume')) {
        return 'Does volume count the space inside the solid or the outside surface area?';
      }
      if (input.concept_id.includes('integers')) {
        return 'If you move left on a number line, are you adding or subtracting?';
      }
      if (input.concept_id.includes('equation')) {
        return 'What is the very first step you would do to undo the last operation?';
      }
      return 'What is one smaller step you can do first to get started?';
    }
    // ELA
    if (input.concept_id.includes('main_idea')) {
      return 'What is this passage mostly about in one short sentence?';
    }
    if (input.concept_id.includes('context')) {
      return 'What clue words in the sentence help you guess the meaning?';
    }
    return 'What is one key detail you noticed that can help you answer?';
  }

  private generateDeterministicItem(input: {
    user: UserProfileEntity;
    track: Track;
    concept_id: string;
  }): GeneratedItem {
    const interests = input.user.thematic_interests?.length
      ? input.user.thematic_interests
      : ['gymnastics', 'cute puppies'];
    const name = input.user.first_name || 'Ashi';
    const theme = interests.includes('cute puppies') ? 'puppy' : 'gymnast';

    if (input.track === 'math') {
      if (input.concept_id.includes('volume')) {
        const l = 8;
        const w = 5;
        const h = 3;
        return {
          prompt: 'Deterministic math item: volume.',
          track: 'math',
          concept_id: input.concept_id,
          story_part: `${name} is building a cozy puppy nap box. Part 1: the puppy needs room to curl up.`,
          question_text: `The box is a rectangular prism that is ${l} units long, ${w} units wide, and ${h} units tall. What is its volume in cubic units?`,
          input_mode: 'short_text',
          expected_answer: String(l * w * h),
        };
      }
      if (input.concept_id.includes('integers')) {
        // -7 + 12 - 5
        return {
          prompt: 'Deterministic math item: integer operations.',
          track: 'math',
          concept_id: input.concept_id,
          story_part: `${name} is doing a ${theme}-themed points challenge. Part 1: points can go up and down.`,
          question_text:
            'Ashi starts with -7 points. She earns 12 points, then loses 5 points. What is her final score?',
          input_mode: 'short_text',
          expected_answer: String(-7 + 12 - 5),
        };
      }
      // multi-step equation
      return {
        prompt: 'Deterministic math item: multi-step equation.',
        track: 'math',
        concept_id: input.concept_id,
        story_part: `${name} is planning a gymnastics routine. Part 1: every move adds points.`,
        question_text:
          'Ashi’s score follows the rule: 3x + 4 = 25. What is x?',
        input_mode: 'short_text',
        expected_answer: String((25 - 4) / 3),
      };
    }

    // ELA (simple sentences, decodable-ish vocabulary)
    if (input.concept_id.includes('main_idea')) {
      const choices = [
        'Ashi likes puppies.',
        'Ashi trains and helps a puppy learn a new trick.',
        'Ashi is scared of dogs.',
        'Ashi wants to quit gymnastics.',
      ];
      return {
        prompt: 'Deterministic ELA item: main idea.',
        track: 'ela',
        concept_id: input.concept_id,
        story_part: `${name} meets a small puppy. Part 1: the puppy is shy but curious.`,
        question_text:
          'Read: "Ashi practices a handstand each day. After practice, she sits with a small puppy. The puppy is shy, so Ashi speaks softly. She shows a toy and waits. The puppy takes one step closer. Ashi smiles and stays calm."\n\nWhat is the main idea?',
        input_mode: 'multiple_choice',
        choices,
        expected_answer: choices[1],
      };
    }

    const choices = [
      'very loud',
      'small and quiet',
      'angry',
      'sleepy',
    ];
    return {
      prompt: 'Deterministic ELA item: context clues.',
      track: 'ela',
      concept_id: input.concept_id,
      story_part: `${name} and the puppy try a new game. Part 1: the puppy listens closely.`,
      question_text:
        'Read: "The puppy made a meek sound. It was a tiny sound, like a whisper."\n\nWhat does meek mean here?',
      input_mode: 'multiple_choice',
      choices,
      expected_answer: choices[1],
    };
  }

  private async generateWithOpenAi(input: {
    user: UserProfileEntity;
    track: Track;
    concept_id: string;
    memory_snippets: string[];
  }): Promise<GeneratedItem> {
    const model = this.config.get<string>('OPENAI_MODEL', 'gpt-4o');
    const interests = input.user.thematic_interests?.join(', ') || 'gymnastics, cute puppies';
    const memoryBlock = input.memory_snippets.length
      ? `Relevant memory:\n- ${input.memory_snippets.join('\n- ')}`
      : 'Relevant memory: none.';

    const system = [
      'You are an empathetic tutor.',
      'Flow State Design: start a playful story, but keep it focused and low-friction.',
      'For MATH: target ~6th grade with Beast Academy / AoPS-style puzzle feel.',
      'For ELA: keep reading level ~4th grade (short sentences, simple words).',
      'Always include the student name and interests in the narrative.',
      'Return STRICT JSON with keys: story_part, question_text, input_mode, choices(optional), expected_answer.',
      'Do not include extra keys.',
    ].join(' ');

    const user = [
      `Student name: ${input.user.first_name}`,
      `Interests: ${interests}`,
      `Track: ${input.track}`,
      `Concept: ${input.concept_id}`,
      memoryBlock,
      'Create ONE problem. The expected_answer should be directly gradable (string).',
    ].join('\n');

    const resp = await this.openai.chat.completions.create({
      model,
      temperature: 0.7,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
    });

    const raw = resp.choices?.[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw) as {
      story_part: string;
      question_text: string;
      input_mode: 'short_text' | 'multiple_choice';
      choices?: string[];
      expected_answer: string;
    };

    return {
      prompt: user,
      track: input.track,
      concept_id: input.concept_id,
      story_part: String(parsed.story_part ?? ''),
      question_text: String(parsed.question_text ?? ''),
      input_mode: parsed.input_mode ?? 'short_text',
      choices: parsed.choices,
      expected_answer: String(parsed.expected_answer ?? ''),
    };
  }
}

