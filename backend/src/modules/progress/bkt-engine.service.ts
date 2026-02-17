import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BKTMasteryEntity } from './entities/bkt-mastery.entity';
import { v4 as uuidv4 } from 'uuid';

/**
 * Bayesian Knowledge Tracing (BKT) Engine
 * 
 * Implements the BKT algorithm to track student mastery of concepts.
 * 
 * BKT Parameters:
 * - P(L0): Initial probability of knowing the concept (default: 0.3)
 * - P(T): Probability of learning (transition rate) (default: 0.3)
 * - P(G): Probability of guessing correctly when not known (default: 0.25)
 * - P(S): Probability of slipping (making mistake when known) (default: 0.1)
 * 
 * Update Formula:
 * P(L_n+1) = P(L_n | evidence) + (1 - P(L_n | evidence)) * P(T)
 */
@Injectable()
export class BKTEngine {
  // BKT Parameters
  private readonly P_L0 = 0.3; // Initial probability of knowing
  private readonly P_T = 0.3; // Learning rate
  private readonly P_G = 0.25; // Guess probability
  private readonly P_S = 0.1; // Slip probability
  private readonly MASTERY_THRESHOLD = 0.85; // 85% confidence for mastery

  constructor(
    @InjectRepository(BKTMasteryEntity)
    private bktRepository: Repository<BKTMasteryEntity>,
  ) {}

  /**
   * Update mastery probability based on student's answer
   */
  async updateMastery(
    user_id: string,
    concept_id: string,
    is_correct: boolean,
  ): Promise<BKTMasteryEntity> {
    // Get or create mastery record
    let mastery = await this.bktRepository.findOne({
      where: { user_id, concept_id },
    });

    if (!mastery) {
      mastery = this.bktRepository.create({
        mastery_id: uuidv4(),
        user_id,
        concept_id,
        probability_known: this.P_L0,
        attempts: 0,
        correct_count: 0,
      });
    }

    // Update attempt counters
    mastery.attempts += 1;
    if (is_correct) {
      mastery.correct_count += 1;
    }
    mastery.last_attempted = new Date();

    // Apply BKT update formula
    const P_L = mastery.probability_known;

    // Calculate posterior probability P(L|evidence)
    let P_L_given_evidence: number;

    if (is_correct) {
      // P(L|correct) = P(correct|L) * P(L) / P(correct)
      const P_correct_given_L = 1 - this.P_S;
      const P_correct_given_not_L = this.P_G;
      const P_correct = P_correct_given_L * P_L + P_correct_given_not_L * (1 - P_L);

      P_L_given_evidence = (P_correct_given_L * P_L) / P_correct;
    } else {
      // P(L|incorrect) = P(incorrect|L) * P(L) / P(incorrect)
      const P_incorrect_given_L = this.P_S;
      const P_incorrect_given_not_L = 1 - this.P_G;
      const P_incorrect = P_incorrect_given_L * P_L + P_incorrect_given_not_L * (1 - P_L);

      P_L_given_evidence = (P_incorrect_given_L * P_L) / P_incorrect;
    }

    // Apply learning: P(L_n+1) = P(L_n|evidence) + (1 - P(L_n|evidence)) * P(T)
    mastery.probability_known = P_L_given_evidence + (1 - P_L_given_evidence) * this.P_T;

    // Ensure probability stays in valid range [0, 1]
    mastery.probability_known = Math.max(0, Math.min(1, mastery.probability_known));

    return this.bktRepository.save(mastery);
  }

  /**
   * Check if user has mastered a concept
   */
  hasMastered(probability_known: number): boolean {
    return probability_known >= this.MASTERY_THRESHOLD;
  }

  /**
   * Get all mastery records for a user
   */
  async getUserMastery(user_id: string): Promise<BKTMasteryEntity[]> {
    return this.bktRepository.find({
      where: { user_id },
      order: { updated_at: 'DESC' },
    });
  }

  /**
   * Get mastery for a specific concept
   */
  async getConceptMastery(user_id: string, concept_id: string): Promise<BKTMasteryEntity | null> {
    return this.bktRepository.findOne({
      where: { user_id, concept_id },
    });
  }

  /**
   * Recommend next concepts based on current mastery levels
   * Returns concepts that are ready to learn (prerequisites met but not mastered)
   */
  async recommendConcepts(user_id: string, domain: 'math' | 'ela', limit: number = 3): Promise<string[]> {
    const masteryRecords = await this.getUserMastery(user_id);

    // Sort by probability (prioritize concepts with moderate difficulty)
    const sortedConcepts = masteryRecords
      .filter((m) => m.concept_id.startsWith(domain))
      .filter((m) => !this.hasMastered(m.probability_known))
      .sort((a, b) => {
        // Prioritize concepts that are partially known (sweet spot for learning)
        const scoreA = Math.abs(a.probability_known - 0.5);
        const scoreB = Math.abs(b.probability_known - 0.5);
        return scoreA - scoreB;
      })
      .slice(0, limit);

    return sortedConcepts.map((m) => m.concept_id);
  }
}
