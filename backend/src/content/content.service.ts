import { Injectable } from '@nestjs/common';
import { MemoryService } from '../memory/memory.service';
import { BktService } from '../bkt/bkt.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfile } from '../entities/user-profile.entity';
import OpenAI from 'openai';

const SYSTEM_PROMPT = `You are an empathetic, patient tutor for a 5th-grade student. You use the Persona Pattern: the student's name is the main character in every problem. Her interests are gymnastics and cute puppies.

Role: Socratic tutor. Never give direct answers. Guide with questions that promote metacognition.

Content rules:
- Math: 6th-grade / Beast Academy rigor. Puzzle-based, discovery learning. Multi-step equations, 3D solids, integer operations.
- ELA: 4th-grade Lexile. Simple sentences, highly decodable words.

Structure math problems as multi-part stories. Use a "curiosity gap": the user must solve the math to reveal the next part of the puppy/gymnastics narrative.`;

@Injectable()
export class ContentService {
  private openai: OpenAI | null = null;

  constructor(
    private memoryService: MemoryService,
    private bktService: BktService,
    @InjectRepository(UserProfile)
    private userRepo: Repository<UserProfile>,
  ) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async generateContent(
    userId: string,
    conceptId: string,
    track: 'math' | 'ela',
    partIndex?: number,
  ): Promise<{
    problem: string;
    expectedAnswer?: string;
    narrativePart?: string;
  }> {
    const user = await this.userRepo.findOne({ where: { user_id: userId } });
    const firstName = user?.first_name ?? 'Ashi';
    const interests = user?.thematic_interests
      ? user.thematic_interests.split(',').map((s) => s.trim())
      : ['gymnastics', 'cute puppies'];

    const memoryContext = await this.memoryService.getContextForGeneration(
      userId,
      conceptId,
    );

    const conceptDesc =
      track === 'math'
        ? '6th-grade math (Beast Academy style: 3D solids, integers, multi-step equations)'
        : '4th-grade ELA (simple sentences, decodable words, main idea, inference)';

    const partInstruction =
      partIndex !== undefined && partIndex > 0
        ? `This is part ${partIndex + 1} of a multi-part story. Reveal the next narrative segment only after the user solves correctly.`
        : 'Start a new multi-part story. Use gymnastics or cute puppies. Create a curiosity gap.';

    const userPrompt = `Generate ONE ${track} problem for ${firstName}.

Concept: ${conceptId} (${conceptDesc})
Interests to weave in: ${interests.join(', ')}

${partInstruction}

${memoryContext ? `Context from memory:\n${memoryContext}` : ''}

Respond in JSON:
{
  "problem": "the problem text with ${firstName} as main character",
  "expectedAnswer": "exact expected answer (for math: number or expression)",
  "narrativePart": "optional: next story segment to reveal after correct answer"
}`;

    if (!this.openai) {
      return this.getFallbackContent(conceptId, track, firstName, interests);
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
      });
      const text = completion.choices[0]?.message?.content;
      if (!text) throw new Error('Empty response');
      return JSON.parse(text) as {
        problem: string;
        expectedAnswer?: string;
        narrativePart?: string;
      };
    } catch {
      return this.getFallbackContent(conceptId, track, firstName, interests);
    }
  }

  async getSocraticQuestion(
    userId: string,
    conceptId: string,
    userAnswer: string,
    problem: string,
  ): Promise<string> {
    const misconceptions = await this.memoryService.findMisconceptions(
      userId,
      conceptId,
    );
    const pastMistakes = misconceptions.map((m) => m.content).join('; ');

    const prompt = `The user answered incorrectly: "${userAnswer}" to problem: "${problem}"

${pastMistakes ? `Past similar mistakes: ${pastMistakes}` : ''}

Respond with exactly ONE guiding Socratic question. Do NOT give the answer. Promote metacognition.`;

    if (!this.openai) {
      return 'Can you walk me through your steps? What made you choose that answer?';
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
      });
      return completion.choices[0]?.message?.content ?? 'What strategy did you use?';
    } catch {
      return 'Can you explain your reasoning step by step?';
    }
  }

  private getFallbackContent(
    conceptId: string,
    track: 'math' | 'ela',
    firstName: string,
    interests: string[],
  ): {
    problem: string;
    expectedAnswer?: string;
    narrativePart?: string;
  } {
    if (track === 'math') {
      const problems: Array<{ problem: string; answer: string }> = [
        {
          problem: `${firstName} is at gymnastics practice. She has 3 balance beams. Each beam is 4 meters long. How many meters of beam does she have in total?`,
          answer: '12',
        },
        {
          problem: `${firstName} is feeding cute puppies. She has -5 treats and receives 8 more. How many treats does she have now?`,
          answer: '3',
        },
        {
          problem: `At the puppy adoption event, ${firstName} counts 2x + 4 = 10 puppies. Solve for x to find how many puppies are in the first pen.`,
          answer: '3',
        },
      ];
      const idx = Math.abs(this.hashCode(conceptId)) % problems.length;
      const p = problems[idx];
      return {
        problem: p.problem,
        expectedAnswer: p.answer,
        narrativePart: `Great job! ${firstName} high-fives a fluffy puppy.`,
      };
    } else {
      return {
        problem: `${firstName} reads a short story about a puppy who learns a new trick. What is the main idea of the first paragraph?`,
        expectedAnswer: 'The puppy wants to learn',
        narrativePart: `Nice! ${firstName} gives the puppy a treat.`,
      };
    }
  }

  private hashCode(str: string): number {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }
    return h;
  }
}
