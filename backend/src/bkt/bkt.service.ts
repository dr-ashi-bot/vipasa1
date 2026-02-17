import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BKTMastery } from '../entities/bkt-mastery.entity';
import { UserProfile } from '../entities/user-profile.entity';
import { MATH_CONCEPTS } from '../curriculum/math-concepts';
import { ELA_CONCEPTS } from '../curriculum/ela-concepts';

// BKT parameters (standard values from research)
const P_INIT = 0.5; // Initial probability of knowing
const P_LEARN = 0.3; // Probability of learning when incorrect
const P_SLIP = 0.1; // Probability of slipping (knowing but answering wrong)
const P_GUESS = 0.25; // Probability of guessing when not knowing

@Injectable()
export class BktService {
  constructor(
    @InjectRepository(BKTMastery)
    private masteryRepo: Repository<BKTMastery>,
    @InjectRepository(UserProfile)
    private userRepo: Repository<UserProfile>,
  ) {}

  /**
   * Get optimal learning path based on BKT mastery and user levels
   */
  async getOptimalLearningPath(userId: string): Promise<{
    mathConcepts: string[];
    elaConcepts: string[];
  }> {
    const user = await this.userRepo.findOne({ where: { user_id: userId } });
    const mathLevel = user?.math_level ?? 6;
    const elaLevel = user?.ela_level ?? 4;

    const masteries = await this.masteryRepo.find({
      where: { user_id: userId },
    });
    const masteryMap = new Map(masteries.map((m) => [m.concept_id, m.probability_known]));

    const mathConcepts = MATH_CONCEPTS.filter((c) => c.grade <= mathLevel)
      .sort((a, b) => (masteryMap.get(a.id) ?? 0) - (masteryMap.get(b.id) ?? 0))
      .map((c) => c.id);

    const elaConcepts = ELA_CONCEPTS.filter((c) => c.grade <= elaLevel)
      .sort((a, b) => (masteryMap.get(a.id) ?? 0) - (masteryMap.get(b.id) ?? 0))
      .map((c) => c.id);

    return { mathConcepts, elaConcepts };
  }

  /**
   * Update BKT probability after a response
   */
  async updateMastery(
    userId: string,
    conceptId: string,
    isCorrect: boolean,
  ): Promise<number> {
    let mastery = await this.masteryRepo.findOne({
      where: { user_id: userId, concept_id: conceptId },
    });

    const pKnown = mastery?.probability_known ?? P_INIT;

    const pCorrectGivenKnown = 1 - P_SLIP;
    const pCorrectGivenUnknown = P_GUESS;
    const pCorrect = pKnown * pCorrectGivenKnown + (1 - pKnown) * pCorrectGivenUnknown;

    let newPKnown: number;
    if (isCorrect) {
      newPKnown =
        (pKnown * pCorrectGivenKnown) /
        (pKnown * pCorrectGivenKnown + (1 - pKnown) * pCorrectGivenUnknown);
    } else {
      const pWrongGivenKnown = P_SLIP;
      const pWrongGivenUnknown = 1 - P_GUESS;
      newPKnown =
        (pKnown * pWrongGivenKnown) /
        (pKnown * pWrongGivenKnown + (1 - pKnown) * pWrongGivenUnknown);
      newPKnown = newPKnown + (1 - newPKnown) * P_LEARN;
    }

    newPKnown = Math.max(0, Math.min(1, newPKnown));

    if (mastery) {
      mastery.probability_known = newPKnown;
      await this.masteryRepo.save(mastery);
    } else {
      mastery = this.masteryRepo.create({
        user_id: userId,
        concept_id: conceptId,
        probability_known: newPKnown,
      });
      await this.masteryRepo.save(mastery);
    }

    return newPKnown;
  }

  /**
   * Get next concept for user (lowest mastery)
   */
  async getNextConcept(
    userId: string,
    track: 'math' | 'ela',
  ): Promise<string | null> {
    const path = await this.getOptimalLearningPath(userId);
    const concepts = track === 'math' ? path.mathConcepts : path.elaConcepts;
    return concepts[0] ?? null;
  }
}
