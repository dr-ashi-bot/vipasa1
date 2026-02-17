import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BktMasteryEntity } from '../db/postgres/bkt-mastery.entity';

export type BktTrack = 'math' | 'ela';

export interface BktParams {
  slip: number; // P(incorrect | known)
  guess: number; // P(correct | unknown)
  learn: number; // P(learn between opportunities)
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

@Injectable()
export class BktService {
  constructor(
    @InjectRepository(BktMasteryEntity)
    private readonly masteryRepo: Repository<BktMasteryEntity>,
  ) {}

  trackForConcept(concept_id: string): BktTrack {
    if (concept_id.startsWith('ela_')) return 'ela';
    return 'math';
  }

  paramsForTrack(track: BktTrack): BktParams {
    // Tuned lightly for MVP. Separate “nodes” exist by concept_id prefix.
    if (track === 'ela') return { slip: 0.12, guess: 0.25, learn: 0.1 };
    return { slip: 0.08, guess: 0.2, learn: 0.15 };
  }

  async getOrCreateMastery(user_id: string, concept_id: string): Promise<BktMasteryEntity> {
    const existing = await this.masteryRepo.findOne({ where: { user_id, concept_id } });
    if (existing) return existing;
    const created = this.masteryRepo.create({
      user_id,
      concept_id,
      probability_known: 0.2,
    });
    return await this.masteryRepo.save(created);
  }

  async getMasteries(user_id: string, conceptIds: string[]): Promise<BktMasteryEntity[]> {
    if (conceptIds.length === 0) return [];
    return await this.masteryRepo.find({
      where: conceptIds.map((concept_id) => ({ user_id, concept_id })),
    });
  }

  updateProbabilityKnown(
    priorPknown: number,
    is_correct: boolean,
    params: BktParams,
  ): number {
    const pK = clamp01(priorPknown);
    const { slip, guess, learn } = params;

    // Posterior given observation
    let posterior: number;
    if (is_correct) {
      const num = pK * (1 - slip);
      const den = num + (1 - pK) * guess;
      posterior = den === 0 ? pK : num / den;
    } else {
      const num = pK * slip;
      const den = num + (1 - pK) * (1 - guess);
      posterior = den === 0 ? pK : num / den;
    }

    // Learning transition
    const next = posterior + (1 - posterior) * learn;
    return clamp01(next);
  }

  async applyObservation(input: {
    user_id: string;
    concept_id: string;
    is_correct: boolean;
  }): Promise<BktMasteryEntity> {
    const mastery = await this.getOrCreateMastery(input.user_id, input.concept_id);
    const track = this.trackForConcept(input.concept_id);
    const nextP = this.updateProbabilityKnown(
      mastery.probability_known,
      input.is_correct,
      this.paramsForTrack(track),
    );
    mastery.probability_known = nextP;
    return await this.masteryRepo.save(mastery);
  }
}

