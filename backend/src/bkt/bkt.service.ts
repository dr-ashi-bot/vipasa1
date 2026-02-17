import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BKTMastery } from './entities/bkt-mastery.entity';

/**
 * Bayesian Knowledge Tracing (BKT) Service
 *
 * Implements the standard BKT algorithm to estimate the probability
 * that a student has mastered a given concept, based on their sequence
 * of correct/incorrect responses.
 *
 * The math and ELA tracks are entirely decoupled - each concept has its
 * own independent mastery state.
 */
@Injectable()
export class BKTService {
  private readonly logger = new Logger(BKTService.name);

  /** Default BKT parameters for new Math concepts (Beast Academy rigor) */
  private readonly MATH_DEFAULTS = {
    probability_known: 0.05,
    probability_transit: 0.15,
    probability_slip: 0.1,
    probability_guess: 0.2,
  };

  /** Default BKT parameters for new ELA concepts (4th-grade level) */
  private readonly ELA_DEFAULTS = {
    probability_known: 0.15,
    probability_transit: 0.25,
    probability_slip: 0.1,
    probability_guess: 0.15,
  };

  constructor(
    @InjectRepository(BKTMastery)
    private readonly masteryRepo: Repository<BKTMastery>,
  ) {}

  /**
   * Get or create a mastery record for a user-concept pair.
   * Math and ELA concepts are stored independently (dual-track).
   */
  async getOrCreateMastery(
    userId: string,
    conceptId: string,
  ): Promise<BKTMastery> {
    let mastery = await this.masteryRepo.findOne({
      where: { user_id: userId, concept_id: conceptId },
    });

    if (!mastery) {
      const track = conceptId.startsWith('ela') ? 'ela' : 'math';
      const defaults =
        track === 'ela' ? this.ELA_DEFAULTS : this.MATH_DEFAULTS;

      mastery = this.masteryRepo.create({
        user_id: userId,
        concept_id: conceptId,
        track,
        ...defaults,
      });
      mastery = await this.masteryRepo.save(mastery);
      this.logger.log(
        `Created new ${track} mastery record for user=${userId}, concept=${conceptId}`,
      );
    }

    return mastery;
  }

  /**
   * Core BKT update algorithm.
   *
   * Given an observation (correct/incorrect), update the posterior
   * probability that the student knows the concept:
   *
   *   If correct:
   *     P(L|correct) = P(L) * (1 - P(S)) / [P(L) * (1 - P(S)) + (1 - P(L)) * P(G)]
   *
   *   If incorrect:
   *     P(L|incorrect) = P(L) * P(S) / [P(L) * P(S) + (1 - P(L)) * (1 - P(G))]
   *
   *   Then apply the learning transition:
   *     P(Lₙ) = P(L|obs) + (1 - P(L|obs)) * P(T)
   */
  async updateMastery(
    userId: string,
    conceptId: string,
    isCorrect: boolean,
  ): Promise<BKTMastery> {
    const mastery = await this.getOrCreateMastery(userId, conceptId);

    const pL = mastery.probability_known;
    const pT = mastery.probability_transit;
    const pS = mastery.probability_slip;
    const pG = mastery.probability_guess;

    let posteriorKnown: number;

    if (isCorrect) {
      const numerator = pL * (1 - pS);
      const denominator = pL * (1 - pS) + (1 - pL) * pG;
      posteriorKnown = denominator > 0 ? numerator / denominator : pL;
    } else {
      const numerator = pL * pS;
      const denominator = pL * pS + (1 - pL) * (1 - pG);
      posteriorKnown = denominator > 0 ? numerator / denominator : pL;
    }

    // Apply learning transition
    const updatedKnown = posteriorKnown + (1 - posteriorKnown) * pT;

    // Clamp to [0, 1]
    mastery.probability_known = Math.min(1.0, Math.max(0.0, updatedKnown));
    mastery.total_attempts += 1;
    if (isCorrect) mastery.correct_attempts += 1;

    const saved = await this.masteryRepo.save(mastery);

    this.logger.log(
      `BKT update: user=${userId}, concept=${conceptId}, ` +
        `correct=${isCorrect}, P(L): ${pL.toFixed(3)} → ${saved.probability_known.toFixed(3)}`,
    );

    return saved;
  }

  /**
   * Check if a concept is considered mastered.
   */
  isMastered(mastery: BKTMastery): boolean {
    return mastery.probability_known >= mastery.mastery_threshold;
  }

  /**
   * Get the optimal next concept for a user on a given track.
   * Returns the concept with the lowest mastery that hasn't been mastered yet.
   * This implements a simple "weakest link" selection strategy.
   */
  async getOptimalNextConcept(
    userId: string,
    track: 'math' | 'ela',
  ): Promise<BKTMastery | null> {
    const concepts = await this.masteryRepo.find({
      where: { user_id: userId, track },
      order: { probability_known: 'ASC' },
    });

    // Return the least-mastered concept that isn't fully mastered
    for (const concept of concepts) {
      if (!this.isMastered(concept)) {
        return concept;
      }
    }

    return null;
  }

  /**
   * Get all mastery records for a user, separated by track.
   */
  async getUserMasteryByTrack(
    userId: string,
  ): Promise<{ math: BKTMastery[]; ela: BKTMastery[] }> {
    const all = await this.masteryRepo.find({
      where: { user_id: userId },
      order: { probability_known: 'ASC' },
    });

    return {
      math: all.filter((m) => m.track === 'math'),
      ela: all.filter((m) => m.track === 'ela'),
    };
  }

  /**
   * Seed initial concepts for a new user based on their grade levels.
   * Math targets 6th-grade Beast Academy rigor.
   * ELA targets 4th-grade Lexile level.
   */
  async seedConceptsForUser(
    userId: string,
    mathLevel: number,
    elaLevel: number,
  ): Promise<void> {
    const mathConcepts = [
      `math_${mathLevel}_integers`,
      `math_${mathLevel}_fractions`,
      `math_${mathLevel}_geometry_3d_solids`,
      `math_${mathLevel}_multi_step_equations`,
      `math_${mathLevel}_ratios`,
      `math_${mathLevel}_number_theory`,
      `math_${mathLevel}_combinatorics`,
      `math_${mathLevel}_logic_puzzles`,
    ];

    const elaConcepts = [
      `ela_${elaLevel}_reading_comprehension`,
      `ela_${elaLevel}_vocabulary`,
      `ela_${elaLevel}_grammar`,
      `ela_${elaLevel}_writing_structure`,
      `ela_${elaLevel}_main_idea`,
      `ela_${elaLevel}_inference`,
    ];

    for (const conceptId of [...mathConcepts, ...elaConcepts]) {
      await this.getOrCreateMastery(userId, conceptId);
    }

    this.logger.log(
      `Seeded ${mathConcepts.length} math + ${elaConcepts.length} ELA concepts for user=${userId}`,
    );
  }
}
