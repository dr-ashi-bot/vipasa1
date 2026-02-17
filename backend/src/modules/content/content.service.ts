import { Injectable } from '@nestjs/common';
import { AIService, ContentGenerationRequest } from './ai.service';
import { UserService } from '../user/user.service';
import { BKTEngine } from '../progress/bkt-engine.service';

export interface GenerateContentDto {
  user_id: string;
  concept_id: string;
  difficulty_override?: number;
}

@Injectable()
export class ContentService {
  constructor(
    private aiService: AIService,
    private userService: UserService,
    private bktEngine: BKTEngine,
  ) {}

  async generateContent(dto: GenerateContentDto) {
    // Get user profile
    const userProfile = await this.userService.findById(dto.user_id);

    // Get mastery level for this concept
    const mastery = await this.bktEngine.getConceptMastery(dto.user_id, dto.concept_id);

    // Determine domain and difficulty
    const domain = dto.concept_id.startsWith('math') ? 'math' : 'ela';
    const gradeLevel = domain === 'math' ? userProfile.math_level : userProfile.ela_level;

    // Calculate difficulty based on mastery (or use override)
    let difficultyLevel = dto.difficulty_override || 5;
    if (mastery) {
      // Adjust difficulty based on mastery probability
      // 0.0-0.3: Easy (3-4)
      // 0.3-0.7: Medium (5-6)
      // 0.7-1.0: Hard (7-9)
      if (mastery.probability_known < 0.3) {
        difficultyLevel = 3;
      } else if (mastery.probability_known < 0.7) {
        difficultyLevel = 6;
      } else {
        difficultyLevel = 8;
      }
    }

    const request: ContentGenerationRequest = {
      user_name: userProfile.first_name,
      interests: userProfile.thematic_interests,
      concept_id: dto.concept_id,
      grade_level: gradeLevel,
      domain,
      difficulty_level: difficultyLevel,
    };

    return this.aiService.generateContent(dto.user_id, request);
  }

  async generateSocraticFeedback(
    user_id: string,
    concept_id: string,
    user_answer: string,
    correct_answer: string,
  ) {
    const feedback = await this.aiService.generateSocraticFeedback(
      user_id,
      concept_id,
      user_answer,
      correct_answer,
    );

    return { feedback };
  }
}
