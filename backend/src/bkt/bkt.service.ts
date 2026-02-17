import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BktMastery, SubjectTrack } from '../database/bkt-mastery.entity';

/**
 * Bayesian Knowledge Tracing (BKT) Engine
 *
 * Implements the standard BKT model with four parameters:
 * - P(L0): Initial probability of knowing the skill (probability_known)
 * - P(T):  Probability of learning on each opportunity (probability_learn)
 * - P(G):  Probability of guessing correctly (probability_guess)
 * - P(S):  Probability of slipping (making a mistake despite knowing) (probability_slip)
 *
 * Math concepts target 6th-grade (Beast Academy level).
 * ELA concepts target 4th-grade (Lexile remediation level).
 */

export interface CurriculumConcept {
  concept_id: string;
  subject: SubjectTrack;
  name: string;
  description: string;
  grade_level: number;
  prerequisites: string[];
}

const MATH_CURRICULUM: CurriculumConcept[] = [
  {
    concept_id: 'math_6_integer_ops',
    subject: SubjectTrack.MATH,
    name: 'Integer Operations',
    description:
      'Adding, subtracting, multiplying, and dividing positive and negative integers',
    grade_level: 6,
    prerequisites: [],
  },
  {
    concept_id: 'math_6_fractions_advanced',
    subject: SubjectTrack.MATH,
    name: 'Advanced Fractions',
    description:
      'Complex fraction operations, mixed numbers, and fraction word problems',
    grade_level: 6,
    prerequisites: ['math_6_integer_ops'],
  },
  {
    concept_id: 'math_6_ratios',
    subject: SubjectTrack.MATH,
    name: 'Ratios & Proportions',
    description:
      'Understanding ratios, setting up and solving proportions, unit rates',
    grade_level: 6,
    prerequisites: ['math_6_fractions_advanced'],
  },
  {
    concept_id: 'math_6_geometry_2d',
    subject: SubjectTrack.MATH,
    name: '2D Geometry & Area',
    description:
      'Area of triangles, parallelograms, trapezoids, and composite figures',
    grade_level: 6,
    prerequisites: [],
  },
  {
    concept_id: 'math_6_geometry_3d',
    subject: SubjectTrack.MATH,
    name: '3D Solids & Volume',
    description:
      'Surface area and volume of rectangular prisms, pyramids, and cylinders',
    grade_level: 6,
    prerequisites: ['math_6_geometry_2d'],
  },
  {
    concept_id: 'math_6_expressions',
    subject: SubjectTrack.MATH,
    name: 'Algebraic Expressions',
    description:
      'Writing, simplifying, and evaluating algebraic expressions with variables',
    grade_level: 6,
    prerequisites: ['math_6_integer_ops'],
  },
  {
    concept_id: 'math_6_equations',
    subject: SubjectTrack.MATH,
    name: 'Multi-Step Equations',
    description:
      'Solving one-variable equations and inequalities, including multi-step',
    grade_level: 6,
    prerequisites: ['math_6_expressions'],
  },
  {
    concept_id: 'math_6_statistics',
    subject: SubjectTrack.MATH,
    name: 'Statistics & Data',
    description:
      'Mean, median, mode, range, histograms, box plots, and data interpretation',
    grade_level: 6,
    prerequisites: [],
  },
  {
    concept_id: 'math_6_number_theory',
    subject: SubjectTrack.MATH,
    name: 'Number Theory Puzzles',
    description:
      'GCF, LCM, prime factorization, divisibility rules, Beast Academy style puzzles',
    grade_level: 6,
    prerequisites: ['math_6_integer_ops'],
  },
  {
    concept_id: 'math_6_coordinate_plane',
    subject: SubjectTrack.MATH,
    name: 'Coordinate Plane',
    description:
      'Plotting points in all four quadrants, distance, and reflections',
    grade_level: 6,
    prerequisites: ['math_6_integer_ops'],
  },
];

const ELA_CURRICULUM: CurriculumConcept[] = [
  {
    concept_id: 'ela_4_main_idea',
    subject: SubjectTrack.ELA,
    name: 'Main Idea & Details',
    description:
      'Identifying the main idea and supporting details in a passage',
    grade_level: 4,
    prerequisites: [],
  },
  {
    concept_id: 'ela_4_vocabulary',
    subject: SubjectTrack.ELA,
    name: 'Vocabulary in Context',
    description:
      'Using context clues to determine word meanings with decodable words',
    grade_level: 4,
    prerequisites: [],
  },
  {
    concept_id: 'ela_4_inference',
    subject: SubjectTrack.ELA,
    name: 'Making Inferences',
    description: 'Drawing conclusions from text evidence at 4th-grade Lexile',
    grade_level: 4,
    prerequisites: ['ela_4_main_idea'],
  },
  {
    concept_id: 'ela_4_sequencing',
    subject: SubjectTrack.ELA,
    name: 'Sequencing Events',
    description: 'Ordering events in a story or informational text',
    grade_level: 4,
    prerequisites: ['ela_4_main_idea'],
  },
  {
    concept_id: 'ela_4_cause_effect',
    subject: SubjectTrack.ELA,
    name: 'Cause and Effect',
    description: 'Identifying cause-and-effect relationships in text',
    grade_level: 4,
    prerequisites: ['ela_4_inference'],
  },
  {
    concept_id: 'ela_4_compare_contrast',
    subject: SubjectTrack.ELA,
    name: 'Compare & Contrast',
    description: 'Finding similarities and differences across texts',
    grade_level: 4,
    prerequisites: ['ela_4_main_idea'],
  },
  {
    concept_id: 'ela_4_grammar',
    subject: SubjectTrack.ELA,
    name: 'Grammar & Mechanics',
    description:
      'Subject-verb agreement, punctuation, capitalization at 4th-grade level',
    grade_level: 4,
    prerequisites: [],
  },
  {
    concept_id: 'ela_4_writing',
    subject: SubjectTrack.ELA,
    name: 'Paragraph Writing',
    description:
      'Writing structured paragraphs with topic sentence and supporting details',
    grade_level: 4,
    prerequisites: ['ela_4_grammar'],
  },
];

@Injectable()
export class BktService {
  private readonly logger = new Logger(BktService.name);

  constructor(
    @InjectRepository(BktMastery)
    private readonly masteryRepo: Repository<BktMastery>,
  ) {}

  getMathCurriculum(): CurriculumConcept[] {
    return MATH_CURRICULUM;
  }

  getElaCurriculum(): CurriculumConcept[] {
    return ELA_CURRICULUM;
  }

  getAllConcepts(): CurriculumConcept[] {
    return [...MATH_CURRICULUM, ...ELA_CURRICULUM];
  }

  /**
   * Initialize BKT mastery nodes for a user across both tracks.
   */
  async initializeMasteryForUser(userId: string): Promise<BktMastery[]> {
    const allConcepts = this.getAllConcepts();
    const masteries: BktMastery[] = [];

    for (const concept of allConcepts) {
      const existing = await this.masteryRepo.findOne({
        where: { user_id: userId, concept_id: concept.concept_id },
      });

      if (!existing) {
        const mastery = this.masteryRepo.create({
          user_id: userId,
          concept_id: concept.concept_id,
          subject_track: concept.subject,
          probability_known: 0.1,
          probability_learn: 0.3,
          probability_guess: 0.1,
          probability_slip: 0.1,
        });
        masteries.push(await this.masteryRepo.save(mastery));
      }
    }

    return masteries;
  }

  /**
   * Core BKT Update Algorithm
   *
   * After observing whether the student answered correctly:
   * 1. Compute P(L_n | obs) = posterior probability of knowing given observation
   * 2. Update P(L_n+1) = P(L_n | obs) + (1 - P(L_n | obs)) * P(T)
   */
  async updateMastery(
    userId: string,
    conceptId: string,
    isCorrect: boolean,
  ): Promise<BktMastery> {
    let mastery = await this.masteryRepo.findOne({
      where: { user_id: userId, concept_id: conceptId },
    });

    if (!mastery) {
      const concept = this.getAllConcepts().find(
        (c) => c.concept_id === conceptId,
      );
      mastery = this.masteryRepo.create({
        user_id: userId,
        concept_id: conceptId,
        subject_track: concept?.subject || SubjectTrack.MATH,
        probability_known: 0.1,
        probability_learn: 0.3,
        probability_guess: 0.1,
        probability_slip: 0.1,
      });
    }

    const pL = mastery.probability_known;
    const pG = mastery.probability_guess;
    const pS = mastery.probability_slip;
    const pT = mastery.probability_learn;

    let pLGivenObs: number;

    if (isCorrect) {
      // P(L | correct) = P(L) * (1 - P(S)) / [P(L) * (1 - P(S)) + (1 - P(L)) * P(G)]
      const numerator = pL * (1 - pS);
      const denominator = pL * (1 - pS) + (1 - pL) * pG;
      pLGivenObs = denominator > 0 ? numerator / denominator : pL;
    } else {
      // P(L | incorrect) = P(L) * P(S) / [P(L) * P(S) + (1 - P(L)) * (1 - P(G))]
      const numerator = pL * pS;
      const denominator = pL * pS + (1 - pL) * (1 - pG);
      pLGivenObs = denominator > 0 ? numerator / denominator : pL;
    }

    // Transition: P(L_n+1) = P(L_n | obs) + (1 - P(L_n | obs)) * P(T)
    const pLNext = pLGivenObs + (1 - pLGivenObs) * pT;

    mastery.probability_known = Math.min(Math.max(pLNext, 0), 1);
    mastery.total_attempts += 1;
    if (isCorrect) mastery.correct_attempts += 1;

    this.logger.log(
      `BKT Update [${conceptId}]: ${pL.toFixed(3)} → ${mastery.probability_known.toFixed(3)} (correct: ${isCorrect})`,
    );

    return this.masteryRepo.save(mastery);
  }

  /**
   * Get the optimal next concept for a user based on BKT mastery.
   * Selects the concept with the lowest mastery that has all prerequisites met (>= 0.7).
   */
  async getOptimalNextConcept(
    userId: string,
    track: SubjectTrack,
  ): Promise<CurriculumConcept | null> {
    const curriculum =
      track === SubjectTrack.MATH
        ? this.getMathCurriculum()
        : this.getElaCurriculum();

    const masteries = await this.masteryRepo.find({
      where: { user_id: userId, subject_track: track },
    });

    const masteryMap = new Map<string, number>();
    for (const m of masteries) {
      masteryMap.set(m.concept_id, m.probability_known);
    }

    const MASTERY_THRESHOLD = 0.7;
    const candidates: Array<{
      concept: CurriculumConcept;
      mastery: number;
    }> = [];

    for (const concept of curriculum) {
      const currentMastery = masteryMap.get(concept.concept_id) ?? 0.1;

      if (currentMastery >= 0.95) continue;

      const prerequisitesMet = concept.prerequisites.every((prereq) => {
        const prereqMastery = masteryMap.get(prereq) ?? 0.1;
        return prereqMastery >= MASTERY_THRESHOLD;
      });

      if (prerequisitesMet) {
        candidates.push({ concept, mastery: currentMastery });
      }
    }

    candidates.sort((a, b) => a.mastery - b.mastery);

    return candidates.length > 0 ? candidates[0].concept : null;
  }

  async getUserMasteries(
    userId: string,
    track?: SubjectTrack,
  ): Promise<BktMastery[]> {
    const where: any = { user_id: userId };
    if (track) where.subject_track = track;
    return this.masteryRepo.find({ where });
  }
}
