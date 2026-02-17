import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ConceptBlueprint } from '../domain/constants/curriculum';
import { SubjectTrack } from '../domain/enums/subject-track.enum';
import { UserProfile } from '../users/user-profile.entity';

export interface GeneratedProblem {
  title: string;
  story_intro: string;
  prompt: string;
  story_cliffhanger: string;
  expected_answer_format: string;
}

@Injectable()
export class TutorService {
  private readonly openAiClient: OpenAI | null;
  private readonly model = process.env.OPENAI_MODEL ?? 'gpt-4o';

  constructor() {
    this.openAiClient = process.env.OPENAI_API_KEY
      ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      : null;
  }

  async generateAdaptiveProblem(input: {
    profile: UserProfile;
    subject: SubjectTrack;
    concept_id: string;
    concept_blueprint: ConceptBlueprint | null;
    prior_misconceptions: string[];
  }): Promise<GeneratedProblem> {
    if (!this.openAiClient) {
      return this.fallbackProblem(input);
    }

    const systemPrompt = [
      'You are an empathetic Socratic tutor for children.',
      'Use persona pattern and role prompting: you are the learner guide and confidence coach.',
      'Always make the learner Ashi the main character.',
      'Always weave these interests into the narrative: gymnastics and cute puppies.',
      'Never produce unsafe content.',
      'Return strictly JSON with keys:',
      'title, story_intro, prompt, story_cliffhanger, expected_answer_format.',
      'Do not include markdown fences.',
    ].join(' ');

    const subjectInstruction =
      input.subject === SubjectTrack.MATH
        ? [
            'Generate a 6th-grade rigor problem inspired by AoPS/Beast Academy.',
            'Use puzzle-based discovery and multi-step reasoning.',
            'Structure as a curiosity gap: part 1 leads to part 2, so solving is needed to reveal the next story beat.',
            'Keep language concise enough for a learner with weaker reading stamina.',
          ].join(' ')
        : [
            'Generate ELA practice constrained to a 4th-grade Lexile level.',
            'Use short and decodable sentence structures.',
            'Keep vocabulary concrete and age-appropriate.',
            'Maintain narrative continuity with Ashi, gymnastics, and puppies.',
          ].join(' ');

    const userPrompt = [
      `subject=${input.subject}`,
      `concept_id=${input.concept_id}`,
      `concept_hint=${input.concept_blueprint?.prompt_hint ?? 'none provided'}`,
      `recent_misconceptions=${input.prior_misconceptions.join(' | ') || 'none'}`,
    ].join('\n');

    try {
      const completion = await this.openAiClient.chat.completions.create({
        model: this.model,
        temperature: 0.8,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'system', content: subjectInstruction },
          { role: 'user', content: userPrompt },
        ],
      });

      const content = completion.choices[0]?.message?.content ?? '';
      const parsed = this.parseJsonObject(content);
      if (parsed) {
        return parsed;
      }
    } catch {
      return this.fallbackProblem(input);
    }

    return this.fallbackProblem(input);
  }

  async generateSocraticQuestion(input: {
    subject: SubjectTrack;
    concept_id: string;
    learner_response: string;
    misconception_memory: string[];
  }): Promise<string> {
    if (!this.openAiClient) {
      return this.fallbackSocraticQuestion(input.subject, input.concept_id);
    }

    const systemPrompt = [
      'You are an empathetic tutor.',
      'If the learner is incorrect, do not provide the answer.',
      'Ask exactly one guiding Socratic question.',
      'The question should trigger metacognition and a next step.',
      'Return plain text only with exactly one question mark.',
    ].join(' ');
    const userPrompt = [
      `subject=${input.subject}`,
      `concept_id=${input.concept_id}`,
      `learner_response=${input.learner_response}`,
      `misconception_memory=${input.misconception_memory.join(' | ') || 'none'}`,
    ].join('\n');

    try {
      const completion = await this.openAiClient.chat.completions.create({
        model: this.model,
        temperature: 0.4,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      });
      const content = completion.choices[0]?.message?.content ?? '';
      return this.ensureSingleQuestion(content);
    } catch {
      return this.fallbackSocraticQuestion(input.subject, input.concept_id);
    }
  }

  private fallbackProblem(input: {
    profile: UserProfile;
    subject: SubjectTrack;
    concept_id: string;
    concept_blueprint: ConceptBlueprint | null;
    prior_misconceptions: string[];
  }): GeneratedProblem {
    const subjectTag =
      input.subject === SubjectTrack.MATH ? 'Math Mission' : 'Reading Mission';
    const challenge =
      input.subject === SubjectTrack.MATH
        ? 'Ashi and a tiny puppy named Mochi are at gymnastics camp. The judges built a stack of cube mats. There are 3 layers: bottom has 12 cubes, middle has 8, top has 5. How many cubes are in the stack?'
        : 'Ashi reads a short note: "The puppy ran to the red mat. Then it sat by the door." What is the main idea of this note?';

    const misconceptionHint =
      input.prior_misconceptions.length > 0
        ? ` Last time, Ashi mixed up this step: ${input.prior_misconceptions[0]}.`
        : '';

    return {
      title: `${subjectTag}: ${input.concept_id}`,
      story_intro:
        `Ashi is training with her gymnastics team and cheering up cute puppies.` +
        ` ${input.concept_blueprint?.prompt_hint ?? ''}` +
        misconceptionHint,
      prompt: challenge,
      story_cliffhanger:
        'When Ashi solves this, the next part reveals whether Mochi earns a ribbon at the final routine.',
      expected_answer_format:
        input.subject === SubjectTrack.MATH
          ? 'Show the key step and final number.'
          : 'Answer in one short sentence.',
    };
  }

  private fallbackSocraticQuestion(
    subject: SubjectTrack,
    conceptId: string,
  ): string {
    if (subject === SubjectTrack.MATH) {
      return this.ensureSingleQuestion(
        `For ${conceptId}, what is one small step you can test first before doing all the arithmetic?`,
      );
    }
    return this.ensureSingleQuestion(
      `For ${conceptId}, which word in the sentence gives the strongest clue to your answer?`,
    );
  }

  private parseJsonObject(raw: string): GeneratedProblem | null {
    const maybeJson = raw.match(/\{[\s\S]*\}/)?.[0] ?? raw;
    try {
      const parsed = JSON.parse(maybeJson) as Record<string, unknown>;
      if (
        typeof parsed.title === 'string' &&
        typeof parsed.story_intro === 'string' &&
        typeof parsed.prompt === 'string' &&
        typeof parsed.story_cliffhanger === 'string' &&
        typeof parsed.expected_answer_format === 'string'
      ) {
        return {
          title: parsed.title,
          story_intro: parsed.story_intro,
          prompt: parsed.prompt,
          story_cliffhanger: parsed.story_cliffhanger,
          expected_answer_format: parsed.expected_answer_format,
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  private ensureSingleQuestion(content: string): string {
    const cleaned = content.replace(/\s+/g, ' ').trim();
    const segments = cleaned
      .split('?')
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0);
    const candidate =
      segments[0] ??
      'What is one small clue from your last step that can help you try again';
    const noPunctuation = candidate.replace(/[.!?]+$/g, '');
    return `${noPunctuation}?`;
  }
}
