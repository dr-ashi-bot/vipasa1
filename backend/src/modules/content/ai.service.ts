import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { VectorDbService, UserMemory } from '../vector-db/vector-db.service';
import { v4 as uuidv4 } from 'uuid';

export interface ContentGenerationRequest {
  user_name: string;
  interests: string[];
  concept_id: string;
  grade_level: number;
  domain: 'math' | 'ela';
  difficulty_level: number;
  past_mistakes?: string[];
}

export interface GeneratedContent {
  content_id: string;
  question: string;
  narrative_context: string;
  possible_answers?: string[];
  correct_answer: string;
  explanation: string;
}

@Injectable()
export class AIService implements OnModuleInit {
  private openai: OpenAI;
  private isInitialized = false;

  constructor(
    private configService: ConfigService,
    private vectorDbService: VectorDbService,
  ) {}

  async onModuleInit() {
    const apiKey = this.configService.get('OPENAI_API_KEY');

    if (!apiKey) {
      console.warn('⚠️  OpenAI API key not configured, AI features will be disabled');
      return;
    }

    this.openai = new OpenAI({ apiKey });
    this.isInitialized = true;
    console.log('✅ OpenAI initialized successfully');
  }

  /**
   * Generate hyper-personalized content using RAG
   */
  async generateContent(
    user_id: string,
    request: ContentGenerationRequest,
  ): Promise<GeneratedContent> {
    if (!this.isInitialized) {
      return this.generateFallbackContent(request);
    }

    try {
      // Query vector DB for relevant memories
      const memories = await this.retrieveUserMemories(user_id, request.concept_id);

      // Build system prompt with persona pattern
      const systemPrompt = this.buildSystemPrompt(request, memories);

      // Generate content
      const completion = await this.openai.chat.completions.create({
        model: this.configService.get('OPENAI_MODEL', 'gpt-4o'),
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Generate a ${request.domain} problem for concept: ${request.concept_id}`,
          },
        ],
        temperature: 0.8,
      });

      const response = completion.choices[0].message.content;
      const parsedContent = this.parseAIResponse(response);

      // Store this generation in memory for future reference
      await this.storeMemory(user_id, {
        content: `Generated question for ${request.concept_id}`,
        memory_type: 'conversation',
        metadata: { concept_id: request.concept_id },
      });

      return {
        content_id: uuidv4(),
        ...parsedContent,
      };
    } catch (error) {
      console.error('AI content generation failed:', error);
      return this.generateFallbackContent(request);
    }
  }

  /**
   * Generate Socratic feedback for incorrect answers
   */
  async generateSocraticFeedback(
    user_id: string,
    concept_id: string,
    user_answer: string,
    correct_answer: string,
  ): Promise<string> {
    if (!this.isInitialized) {
      return 'Think about what the problem is asking. Can you try again?';
    }

    try {
      // Retrieve past mistakes
      const memories = await this.vectorDbService.queryMemories(user_id, [], 3);
      const pastMistakes = memories
        .filter((m) => m.memory_type === 'misconception')
        .map((m) => m.content)
        .join('; ');

      const systemPrompt = `You are an empathetic Socratic tutor. Never give the answer directly.
Instead, ask ONE guiding question that helps the student discover their mistake.
Keep language at a 4th-grade reading level.
Past mistakes: ${pastMistakes || 'None recorded'}`;

      const completion = await this.openai.chat.completions.create({
        model: this.configService.get('OPENAI_MODEL', 'gpt-4o'),
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Concept: ${concept_id}\nStudent answered: ${user_answer}\nCorrect answer: ${correct_answer}\n\nAsk a guiding question.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 100,
      });

      const feedback = completion.choices[0].message.content;

      // Store this misconception in memory
      await this.storeMemory(user_id, {
        content: `Misconception in ${concept_id}: answered ${user_answer} instead of ${correct_answer}`,
        memory_type: 'misconception',
        metadata: { concept_id, user_answer, correct_answer },
      });

      return feedback;
    } catch (error) {
      console.error('Socratic feedback generation failed:', error);
      return 'Think carefully about the problem. What step should you try differently?';
    }
  }

  /**
   * Build system prompt with persona pattern and context injection
   */
  private buildSystemPrompt(request: ContentGenerationRequest, memories: UserMemory[]): string {
    const memoryContext =
      memories.length > 0
        ? `\n\nRelevant past interactions:\n${memories.map((m) => `- ${m.content}`).join('\n')}`
        : '';

    return `You are an expert educational content creator specializing in ${request.domain}.

PERSONA: You create engaging, story-driven problems that make learning feel like an adventure.

USER PROFILE:
- Name: ${request.name}
- Interests: ${request.interests.join(', ')}
- ${request.domain === 'math' ? 'Math' : 'Reading'} Level: Grade ${request.grade_level}
${request.domain === 'math' ? '- Style: Beast Academy / Art of Problem Solving (puzzle-based, discovery learning)' : '- Lexile: 4th grade (simple sentences, decodable words)'}

TASK: Create a ${request.domain} problem about "${request.concept_id}" that:
1. Features ${request.user_name} as the main character
2. Involves ${request.interests[0] || 'a fun adventure'}
3. Creates a "curiosity gap" - make them want to solve it to continue the story
4. ${request.domain === 'math' ? 'Requires multi-step reasoning' : 'Uses simple, clear language'}
5. Difficulty: ${request.difficulty_level}/10

${memoryContext}

FORMAT YOUR RESPONSE AS JSON:
{
  "narrative_context": "The story setup (2-3 sentences)",
  "question": "The actual problem to solve",
  "possible_answers": ["A", "B", "C", "D"] (if multiple choice),
  "correct_answer": "The correct answer",
  "explanation": "Why this answer is correct (revealed after solving)"
}`;
  }

  /**
   * Parse AI response into structured content
   */
  private parseAIResponse(response: string): Omit<GeneratedContent, 'content_id'> {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          question: parsed.question || response,
          narrative_context: parsed.narrative_context || '',
          possible_answers: parsed.possible_answers,
          correct_answer: parsed.correct_answer || '',
          explanation: parsed.explanation || '',
        };
      }
    } catch (error) {
      console.warn('Failed to parse JSON response, using raw text');
    }

    // Fallback to raw response
    return {
      question: response,
      narrative_context: '',
      correct_answer: '',
      explanation: '',
    };
  }

  /**
   * Retrieve relevant user memories using embeddings
   */
  private async retrieveUserMemories(user_id: string, concept_id: string): Promise<UserMemory[]> {
    try {
      // Generate embedding for the concept
      const embedding = await this.generateEmbedding(concept_id);
      return this.vectorDbService.queryMemories(user_id, embedding, 5);
    } catch (error) {
      console.error('Failed to retrieve memories:', error);
      return [];
    }
  }

  /**
   * Generate embedding for text using OpenAI
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    if (!this.isInitialized) {
      return [];
    }

    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      return [];
    }
  }

  /**
   * Store memory in vector database
   */
  private async storeMemory(
    user_id: string,
    data: {
      content: string;
      memory_type: 'conversation' | 'misconception' | 'preference' | 'achievement';
      metadata?: Record<string, any>;
    },
  ): Promise<void> {
    try {
      const embedding = await this.generateEmbedding(data.content);
      const memory: UserMemory = {
        id: uuidv4(),
        user_id,
        content: data.content,
        memory_type: data.memory_type,
        metadata: data.metadata,
        created_at: new Date(),
      };

      await this.vectorDbService.storeMemory(memory, embedding);
    } catch (error) {
      console.error('Failed to store memory:', error);
    }
  }

  /**
   * Fallback content generation when AI is not available
   */
  private generateFallbackContent(request: ContentGenerationRequest): GeneratedContent {
    return {
      content_id: uuidv4(),
      narrative_context: `${request.user_name} is practicing ${request.concept_id} today!`,
      question: `Solve this ${request.domain} problem related to ${request.concept_id}.`,
      correct_answer: '42',
      explanation: 'This is a placeholder problem. Configure OpenAI API to get personalized content.',
    };
  }
}
