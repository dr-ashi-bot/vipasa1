import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VectorStoreService } from './vector-store.service';
import { BktService, CurriculumConcept } from '../bkt/bkt.service';
import { UserService } from '../user/user.service';
import { SubjectTrack } from '../database/bkt-mastery.entity';

export interface GeneratedContent {
  concept_id: string;
  subject: SubjectTrack;
  question: string;
  narrative: string;
  hint?: string;
  correct_answer: string;
  difficulty: number;
  story_part?: number;
}

export interface SocraticResponse {
  guiding_question: string;
  encouragement: string;
  related_misconceptions: string[];
}

/**
 * Content Generation Service
 *
 * Implements the RAG pipeline with:
 * - Persona Pattern (empathetic tutor)
 * - User personalization (name, interests injected)
 * - Curiosity Gap (multi-part story problems)
 * - Socratic feedback (guiding questions, never gives answers)
 * - Dual-track awareness (Math at 6th grade, ELA at 4th grade)
 */
@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly vectorStore: VectorStoreService,
    private readonly bktService: BktService,
    private readonly userService: UserService,
  ) {}

  /**
   * Build the system prompt with Persona Pattern and Role Prompting.
   */
  private buildSystemPrompt(
    userName: string,
    interests: string[],
  ): string {
    return `You are a warm, encouraging, and empathetic tutor named "Coach Spark" who helps ${userName} learn.
You LOVE ${interests.join(' and ')} just as much as ${userName} does!

CORE RULES:
1. NEVER give away the answer directly. Always guide through discovery.
2. Use ${userName}'s interests (${interests.join(', ')}) in ALL story problems and narratives.
3. For MATH: Generate problems at 6th-grade level with Beast Academy / Art of Problem Solving rigor.
   Focus on puzzle-based discovery learning that makes the student think creatively.
4. For ELA/READING: Keep ALL text at a 4th-grade Lexile level (740L-940L).
   Use simple sentence structures and highly decodable words.
5. Create multi-part story problems that use a "Curiosity Gap" - the student must solve 
   the math/reading challenge to reveal the next part of an exciting ${interests[0]} or ${interests[1]} story.
6. Be enthusiastic but age-appropriate. Use encouraging phrases like "Great thinking!" and "You're so close!"
7. If the student makes an error, ask exactly ONE Socratic guiding question to promote metacognition.
   Reference their past misconceptions to help them see patterns in their thinking.`;
  }

  /**
   * Generate personalized learning content using AI with RAG context.
   */
  async generateContent(
    userId: string,
    conceptId: string,
  ): Promise<GeneratedContent> {
    const user = await this.userService.getUserById(userId);
    const concept = this.bktService
      .getAllConcepts()
      .find((c) => c.concept_id === conceptId);

    if (!concept) {
      throw new Error(`Concept ${conceptId} not found in curriculum`);
    }

    const relevantContext = await this.vectorStore.queryRelevantContext(
      userId,
      conceptId,
    );
    const pastMisconceptions = await this.vectorStore.getMisconceptions(
      userId,
      conceptId,
    );

    const systemPrompt = this.buildSystemPrompt(
      user.first_name,
      user.thematic_interests,
    );

    const contextSummary = relevantContext
      .map((doc) => doc.content)
      .join('\n---\n');

    const misconceptionSummary =
      pastMisconceptions.length > 0
        ? `\nPast mistakes on this concept:\n${pastMisconceptions.map((m) => m.content).join('\n')}`
        : '';

    const userPrompt = `Generate a learning problem for ${user.first_name}.
Concept: ${concept.name} (${concept.concept_id})
Description: ${concept.description}
Subject: ${concept.subject === SubjectTrack.MATH ? 'Mathematics - 6th Grade Beast Academy Level' : 'English Language Arts - 4th Grade Lexile Level'}
Student Interests: ${user.thematic_interests.join(', ')}

Previous context:
${contextSummary}
${misconceptionSummary}

Create a multi-part story problem featuring ${user.first_name} and her interests.
The problem should use a Curiosity Gap - the narrative should be compelling and 
the student must solve the problem to reveal what happens next in the story.

Respond in this exact JSON format:
{
  "narrative": "The story setup featuring ${user.first_name} and her interests",
  "question": "The actual learning question",
  "hint": "A subtle hint that doesn't give away the answer",
  "correct_answer": "The correct answer",
  "difficulty": <1-5 scale>,
  "story_part": <part number in the ongoing story>
}`;

    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');
    const anthropicKey = this.configService.get<string>('ANTHROPIC_API_KEY');

    if (openaiKey || anthropicKey) {
      return this.callAiApi(systemPrompt, userPrompt, concept, openaiKey, anthropicKey);
    }

    return this.generateFallbackContent(user.first_name, user.thematic_interests, concept);
  }

  /**
   * Call AI API (OpenAI or Anthropic) for content generation.
   */
  private async callAiApi(
    systemPrompt: string,
    userPrompt: string,
    concept: CurriculumConcept,
    openaiKey?: string,
    anthropicKey?: string,
  ): Promise<GeneratedContent> {
    try {
      if (openaiKey) {
        const { default: OpenAI } = await import('openai');
        const client = new OpenAI({ apiKey: openaiKey });
        const response = await client.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.8,
          max_tokens: 1000,
        });
        const content = response.choices[0]?.message?.content || '';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            concept_id: concept.concept_id,
            subject: concept.subject as SubjectTrack,
            ...parsed,
          };
        }
      }

      if (anthropicKey) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1000,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }],
          }),
        });
        const data = await response.json();
        const text = data.content?.[0]?.text || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            concept_id: concept.concept_id,
            subject: concept.subject as SubjectTrack,
            ...parsed,
          };
        }
      }
    } catch (error) {
      this.logger.warn(`AI API call failed, using fallback: ${error.message}`);
    }

    return this.generateFallbackContent('Ashi', ['gymnastics', 'cute puppies'], concept);
  }

  /**
   * Generate fallback content when AI APIs are not available.
   * Still incorporates personalization and Beast Academy-style problems.
   */
  private generateFallbackContent(
    userName: string,
    interests: string[],
    concept: CurriculumConcept,
  ): GeneratedContent {
    const templates = this.getTemplatesForConcept(
      concept,
      userName,
      interests,
    );
    const template = templates[Math.floor(Math.random() * templates.length)];
    return {
      concept_id: concept.concept_id,
      subject: concept.subject as SubjectTrack,
      ...template,
    };
  }

  private getTemplatesForConcept(
    concept: CurriculumConcept,
    name: string,
    interests: string[],
  ): Array<{
    narrative: string;
    question: string;
    hint: string;
    correct_answer: string;
    difficulty: number;
    story_part: number;
  }> {
    const interest1 = interests[0] || 'gymnastics';
    const interest2 = interests[1] || 'cute puppies';

    const templateMap: Record<string, any[]> = {
      math_6_integer_ops: [
        {
          narrative: `${name} is training for a big ${interest1} competition! She needs to figure out her total score. In the morning, she earned 47 points on the balance beam. But then she got a 12-point deduction for stepping out of bounds. In the afternoon, she earned 35 more points on the floor routine, but lost 8 points for a wobble. Meanwhile, her ${interest2} friend Biscuit was watching from the stands, wagging his tail every time ${name} stuck a landing! To find out what surprise Biscuit has for ${name} after the competition, you need to calculate her final score...`,
          question: `What is ${name}'s final score? Calculate: 47 + (-12) + 35 + (-8)`,
          hint: 'Try adding all the positive numbers together first, then all the negative numbers, and combine them!',
          correct_answer: '62',
          difficulty: 2,
          story_part: 1,
        },
        {
          narrative: `${name} is helping organize a ${interest2} adoption event at the ${interest1} gym! The temperature outside started at 3°F. It dropped 15°F overnight, then rose 8°F by morning when the puppies arrived. What was the temperature when the adorable puppies showed up?`,
          question: 'Calculate: 3 + (-15) + 8',
          hint: 'Think of a number line. Start at 3, move left 15 spaces, then right 8 spaces.',
          correct_answer: '-4',
          difficulty: 2,
          story_part: 1,
        },
      ],
      math_6_geometry_3d: [
        {
          narrative: `${name} is building a special house for her favorite ${interest2}! The puppy house is shaped like a rectangular prism. It needs to be 3 feet long, 2 feet wide, and 2.5 feet tall. ${name} wants to know how much space Biscuit will have inside, and how much paint she needs for the outside! After she calculates this, she'll discover a hidden gymnastics surprise inside the puppy house...`,
          question: `Calculate the volume and surface area of the puppy house (3 ft × 2 ft × 2.5 ft). Give your answer as "Volume: __ cubic feet, Surface Area: __ square feet"`,
          hint: 'Volume = length × width × height. Surface Area = 2(lw + lh + wh). Try calculating each face separately!',
          correct_answer: 'Volume: 15 cubic feet, Surface Area: 31 square feet',
          difficulty: 3,
          story_part: 1,
        },
      ],
      math_6_equations: [
        {
          narrative: `${name} and her ${interest1} team are going to a ${interest2} rescue shelter! Each team member wants to adopt the same number of puppies. There are 5 team members and they found that 3 more puppies arrived, making the total 23. To find out how many puppies each gymnast gets to play with, solve the equation!`,
          question: 'Solve for x: 5x + 3 = 23',
          hint: 'First, what happens if you subtract 3 from both sides?',
          correct_answer: 'x = 4',
          difficulty: 2,
          story_part: 1,
        },
      ],
      math_6_ratios: [
        {
          narrative: `At ${name}'s ${interest1} academy, for every 2 hours of practice, the coach lets everyone play with the ${interest2} for 30 minutes! If ${name} practiced for 7 hours this week, how much puppy playtime did she earn?`,
          question: 'If the ratio of practice time to puppy time is 2 hours : 30 minutes, how many minutes of puppy time does 7 hours of practice earn?',
          hint: 'Set up a proportion: 2/30 = 7/x. Or think about how many "2-hour blocks" fit in 7 hours.',
          correct_answer: '105 minutes',
          difficulty: 3,
          story_part: 1,
        },
      ],
      ela_4_main_idea: [
        {
          narrative: `Read this short passage about ${name}'s adventure:`,
          question: `"${name} went to the park with her puppy, Biscuit. They played fetch near the big oak tree. Then they ran through the sprinklers. Biscuit loved to splash in the water. ${name} laughed and laughed. It was the best day at the park." What is the main idea of this passage?\n\nA) Biscuit likes water\nB) ${name} and Biscuit had a fun day at the park\nC) The park has a big oak tree\nD) ${name} likes to laugh`,
          hint: 'The main idea is what the WHOLE passage is about, not just one detail.',
          correct_answer: 'B',
          difficulty: 1,
          story_part: 1,
        },
      ],
      ela_4_vocabulary: [
        {
          narrative: `${name} found this word while reading about ${interest1}:`,
          question: `"The gymnast was very agile. She could twist and turn with ease." What does "agile" most likely mean?\n\nA) Tired\nB) Able to move quickly and easily\nC) Very tall\nD) Scared`,
          hint: 'Look at the words around "agile." What does "twist and turn with ease" tell you?',
          correct_answer: 'B',
          difficulty: 1,
          story_part: 1,
        },
      ],
      ela_4_inference: [
        {
          narrative: `Read about ${name}'s morning:`,
          question: `"${name} woke up and looked out the window. She smiled very wide. She grabbed her leotard and her puppy's leash. She packed treats in her bag." Where is ${name} most likely going?\n\nA) To school\nB) To the grocery store\nC) To ${interest1} practice with her puppy\nD) To bed`,
          hint: 'What clues do the leotard and the puppy leash give you?',
          correct_answer: 'C',
          difficulty: 2,
          story_part: 1,
        },
      ],
    };

    const defaultTemplates = [
      {
        narrative: `${name} is on an adventure that combines her love of ${interest1} and ${interest2}! To continue the story, solve this challenge about ${concept.name}.`,
        question: `Practice problem for ${concept.name}: ${concept.description}. Think carefully and show your work!`,
        hint: 'Break the problem into smaller steps and tackle each one.',
        correct_answer: 'Varies - check with your tutor!',
        difficulty: 2,
        story_part: 1,
      },
    ];

    return templateMap[concept.concept_id] || defaultTemplates;
  }

  /**
   * Generate a Socratic response when the user answers incorrectly.
   * Queries vector store for past misconceptions and crafts one guiding question.
   */
  async generateSocraticResponse(
    userId: string,
    conceptId: string,
    userAnswer: string,
    correctAnswer: string,
    question: string,
  ): Promise<SocraticResponse> {
    const user = await this.userService.getUserById(userId);
    const pastMisconceptions = await this.vectorStore.getMisconceptions(
      userId,
      conceptId,
    );

    const errorAnalysis = this.analyzeError(userAnswer, correctAnswer, conceptId);

    await this.vectorStore.storeMisconception(
      userId,
      conceptId,
      question,
      userAnswer,
      correctAnswer,
      errorAnalysis,
    );

    const relatedMisconceptions = pastMisconceptions.map(
      (m) => m.content,
    );

    const guidingQuestion = this.craftSocraticQuestion(
      user.first_name,
      user.thematic_interests,
      conceptId,
      userAnswer,
      correctAnswer,
      errorAnalysis,
      relatedMisconceptions,
    );

    return {
      guiding_question: guidingQuestion,
      encouragement: `Great effort, ${user.first_name}! Let's think about this together. 🤔`,
      related_misconceptions: relatedMisconceptions,
    };
  }

  private analyzeError(
    userAnswer: string,
    correctAnswer: string,
    conceptId: string,
  ): string {
    if (conceptId.startsWith('math_')) {
      const userNum = parseFloat(userAnswer);
      const correctNum = parseFloat(correctAnswer);

      if (!isNaN(userNum) && !isNaN(correctNum)) {
        if (Math.abs(userNum) === Math.abs(correctNum)) {
          return 'Sign error - likely confusion with negative numbers';
        }
        if (userNum === correctNum * 10 || userNum === correctNum / 10) {
          return 'Place value error - off by a factor of 10';
        }
        if (
          Math.abs(userNum - correctNum) <= 2 &&
          Math.abs(userNum - correctNum) > 0
        ) {
          return 'Arithmetic slip - close to correct, minor calculation error';
        }
      }
      return 'Conceptual misunderstanding - may need to revisit the concept';
    }

    return 'Comprehension gap - may need to re-read or use context clues';
  }

  private craftSocraticQuestion(
    name: string,
    interests: string[],
    conceptId: string,
    userAnswer: string,
    correctAnswer: string,
    errorAnalysis: string,
    pastMisconceptions: string[],
  ): string {
    const hasRepeatedError =
      pastMisconceptions.length > 0 &&
      pastMisconceptions.some((m) => m.includes(errorAnalysis));

    if (errorAnalysis.includes('Sign error')) {
      return `${name}, you're so close! I noticed something about the sign of your answer. When we work with negative numbers in ${interests[0]}, it's like counting backwards on the score board. Can you check: did you keep track of which numbers were positive and which were negative?`;
    }

    if (errorAnalysis.includes('Place value')) {
      return `${name}, great thinking! Your digits are right, but something shifted. Imagine you're counting ${interests[1]} in groups of 10 — could you double-check where the decimal point should go?`;
    }

    if (errorAnalysis.includes('Arithmetic slip')) {
      return `${name}, you clearly understand the concept! There might be a tiny calculation slip. Can you try the arithmetic one more time, maybe using a different method to check?`;
    }

    if (hasRepeatedError) {
      return `${name}, I've noticed this kind of challenge has come up before — and that's totally normal! Let's slow down. Can you explain in your own words what the first step should be? Sometimes the ${interests[1]} need to take things one paw at a time! 🐾`;
    }

    if (conceptId.startsWith('ela_')) {
      return `${name}, let's go back to the passage together. Can you point to the sentence that you think gives the best clue for the answer? Reading is like a ${interests[0]} routine — every move (or word) matters!`;
    }

    return `${name}, interesting answer! Let's work through this step by step. What's the very first thing you would do to solve this problem? Think of it like the first move in a ${interests[0]} routine — start with a solid foundation!`;
  }
}
