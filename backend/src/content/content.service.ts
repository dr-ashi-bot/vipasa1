import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { BKTService } from '../bkt/bkt.service';
import { VectorMemoryService } from './vector-memory.service';
import { GenerateContentDto } from './dto/generate-content.dto';

/**
 * Content Generation Service
 *
 * Implements Retrieval-Augmented Generation (RAG) with:
 * - Persona Pattern: empathetic tutor
 * - Role Prompting: age-appropriate language
 * - Curiosity Gap: multi-part stories
 * - Socratic Feedback: guiding questions, never giving answers
 */
@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly bktService: BKTService,
    private readonly vectorMemory: VectorMemoryService,
  ) {}

  /**
   * Build the system prompt implementing the Persona Pattern.
   */
  private buildSystemPrompt(
    userName: string,
    interests: string[],
    track: 'math' | 'ela',
    gradeLevel: number,
  ): string {
    const interestList = interests.join(' and ');

    return `You are a warm, empathetic, and encouraging tutor for a 5th-grade student named ${userName}. 
You absolutely love ${interestList}, just like ${userName} does!

CORE RULES:
1. PERSONA: You are patient, cheerful, and speak at an age-appropriate level. Use simple language.
2. NEVER GIVE ANSWERS DIRECTLY. If ${userName} gets something wrong, ask exactly ONE Socratic guiding question.
3. CURIOSITY GAP: Structure every math word problem as a multi-part story featuring ${userName} as the main character, 
   incorporating ${interestList} into the narrative. Each problem should end on a mini-cliffhanger that compels 
   ${userName} to solve the next problem to continue the story.
4. ${track === 'math' ? `MATH RIGOR: Generate problems at grade ${gradeLevel} level with Beast Academy/Art of Problem Solving style - 
   puzzle-based, discovery learning. Topics: 3D solids, integer operations, multi-step equations, ratios, combinatorics.` : 
   `ELA LEVEL: All text MUST be at a 4th-grade Lexile level (grade ${gradeLevel}). Use simple sentence structures, 
   highly decodable words, and short paragraphs.`}
5. METACOGNITION: After any mistake, ask ${userName} to explain their thinking before providing a hint.
6. POSITIVE FRAMING: Celebrate effort, not just correctness. Use phrases like "Great thinking!" and "You're so close!"

NARRATIVE TEMPLATE:
- ${userName} is on an adventure involving ${interestList}.
- Each problem is a chapter in a continuing story.
- The math/reading challenge is woven naturally into the plot.
- Solving the problem unlocks the next part of the story.`;
  }

  /**
   * Build the content generation prompt with RAG context.
   */
  private buildContentPrompt(
    conceptId: string,
    masteryLevel: number,
    pastMistakes: string[],
    previousAnswer?: string,
  ): string {
    const difficultyLabel =
      masteryLevel < 0.3
        ? 'introductory'
        : masteryLevel < 0.6
          ? 'moderate'
          : masteryLevel < 0.85
            ? 'challenging'
            : 'advanced mastery-check';

    let prompt = `Generate a ${difficultyLabel} problem for concept: ${conceptId}.
Current mastery: ${(masteryLevel * 100).toFixed(1)}%.

The problem should be at the appropriate difficulty for this mastery level.
Format your response as JSON with these fields:
{
  "story_text": "The narrative text leading up to the problem",
  "question": "The specific question to answer",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "correct_answer": "The letter of the correct option",
  "hint": "A gentle hint if needed",
  "explanation": "Step-by-step explanation (only revealed after answering)",
  "story_continuation": "A cliffhanger teaser for what happens next in the story"
}`;

    if (pastMistakes.length > 0) {
      prompt += `\n\nPAST MISTAKES ON THIS CONCEPT (from long-term memory):\n`;
      pastMistakes.forEach((mistake, i) => {
        prompt += `${i + 1}. ${mistake}\n`;
      });
      prompt += `\nDesign this problem to specifically address these recurring misconceptions.`;
    }

    if (previousAnswer) {
      prompt += `\n\nSOCRATIC FOLLOW-UP REQUIRED:
The student just answered incorrectly with: "${previousAnswer}"
DO NOT give the correct answer. Instead, analyze the error and ask exactly ONE guiding 
Socratic question that will help the student discover their mistake through metacognition.
Format as JSON:
{
  "socratic_question": "Your guiding question here",
  "error_analysis": "What misconception this likely reveals",
  "encouragement": "A positive, supportive message"
}`;
    }

    return prompt;
  }

  /**
   * Generate personalized content using RAG pipeline.
   */
  async generateContent(dto: GenerateContentDto): Promise<Record<string, unknown>> {
    const user = await this.userService.findById(dto.user_id);
    const mastery = await this.bktService.getOrCreateMastery(
      dto.user_id,
      dto.concept_id,
    );

    const track = dto.concept_id.startsWith('ela') ? 'ela' : 'math';
    const gradeLevel = track === 'math' ? user.math_level : user.ela_level;

    // RAG: Retrieve past mistakes from vector memory
    const pastMistakes = await this.vectorMemory.retrievePastMistakes(
      dto.user_id,
      dto.concept_id,
    );

    // Build prompts
    const systemPrompt = this.buildSystemPrompt(
      user.first_name,
      user.thematic_interests,
      track,
      gradeLevel,
    );

    const contentPrompt = this.buildContentPrompt(
      dto.concept_id,
      mastery.probability_known,
      pastMistakes,
      dto.previous_answer,
    );

    // Call LLM (OpenAI or Anthropic)
    const aiResponse = await this.callLLM(systemPrompt, contentPrompt);

    // Store interaction in vector memory for future RAG retrieval
    await this.vectorMemory.storeInteraction(dto.user_id, {
      concept_id: dto.concept_id,
      prompt: contentPrompt,
      response: aiResponse,
      timestamp: new Date().toISOString(),
      session_id: dto.session_id,
    });

    this.logger.log(
      `Generated content for user=${dto.user_id}, concept=${dto.concept_id}`,
    );

    return {
      content: aiResponse,
      mastery_level: mastery.probability_known,
      concept_id: dto.concept_id,
      track,
    };
  }

  /**
   * Call the LLM (OpenAI GPT-4o or Anthropic Claude 3.5).
   * Falls back to a structured placeholder if API keys are not configured.
   */
  private async callLLM(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<Record<string, unknown>> {
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');
    const anthropicKey = this.configService.get<string>('ANTHROPIC_API_KEY');

    // Try OpenAI first
    if (openaiKey && !openaiKey.startsWith('sk-placeholder')) {
      try {
        const { default: OpenAI } = await import('openai');
        const openai = new OpenAI({ apiKey: openaiKey });
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 1500,
          response_format: { type: 'json_object' },
        });
        return JSON.parse(completion.choices[0].message.content ?? '{}');
      } catch (err) {
        this.logger.warn(`OpenAI call failed: ${err}`);
      }
    }

    // Try Anthropic as fallback
    if (anthropicKey && !anthropicKey.startsWith('sk-ant-placeholder')) {
      try {
        const { default: Anthropic } = await import('@anthropic-ai/sdk');
        const anthropic = new Anthropic({ apiKey: anthropicKey });
        const message = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1500,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        });
        const textBlock = message.content.find((b) => b.type === 'text');
        return JSON.parse((textBlock as { type: 'text'; text: string })?.text ?? '{}');
      } catch (err) {
        this.logger.warn(`Anthropic call failed: ${err}`);
      }
    }

    // Fallback: structured placeholder content
    this.logger.warn('No LLM API key configured, returning placeholder content');
    return this.generatePlaceholderContent(systemPrompt, userPrompt);
  }

  /**
   * Generate structured placeholder content when no LLM is available.
   */
  private generatePlaceholderContent(
    _systemPrompt: string,
    _userPrompt: string,
  ): Record<string, unknown> {
    return {
      story_text:
        'Ashi was practicing her gymnastics routine when she noticed something amazing. ' +
        'A cute puppy was watching her from the sidelines, and it seemed to be counting her flips!',
      question:
        'If Ashi does 3 sets of gymnastics flips, and each set has 4 flips, ' +
        'how many flips does the puppy count in total?',
      options: ['A) 7', 'B) 12', 'C) 10', 'D) 15'],
      correct_answer: 'B',
      hint: 'Think about what operation you use when you have equal groups!',
      explanation:
        'When we have 3 sets with 4 flips each, we multiply: 3 × 4 = 12 flips total.',
      story_continuation:
        'The puppy barked happily at exactly 12 barks — one for each flip! ' +
        'But then, something unexpected happened at the gym...',
    };
  }
}
