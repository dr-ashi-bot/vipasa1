import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BKTMastery } from "../../entities/bkt-mastery.entity";
import type { SubjectTrack } from "../types";

interface BktUpdateResult {
  previous_probability: number;
  updated_probability: number;
  mastery: BKTMastery;
}

@Injectable()
export class BktService {
  constructor(
    @InjectRepository(BKTMastery)
    private readonly masteryRepository: Repository<BKTMastery>,
  ) {}

  async getMasterySnapshot(userId: string): Promise<BKTMastery[]> {
    return this.masteryRepository.find({
      where: { user_id: userId },
      order: { updated_at: "DESC" },
    });
  }

  async updateMastery(
    user_id: string,
    concept_id: string,
    track: SubjectTrack,
    isCorrect: boolean,
  ): Promise<BktUpdateResult> {
    const existing = await this.masteryRepository.findOne({
      where: { user_id, concept_id, track },
    });

    const mastery =
      existing ??
      this.masteryRepository.create({
        user_id,
        concept_id,
        track,
        probability_known: 0.25,
        slip: 0.1,
        guess: 0.2,
        transition: 0.15,
      });

    const previous = mastery.probability_known;
    const posterior = this.applyEvidence(previous, mastery.slip, mastery.guess, isCorrect);
    const transitioned = posterior + (1 - posterior) * mastery.transition;
    mastery.probability_known = this.clamp(transitioned);

    const saved = await this.masteryRepository.save(mastery);
    return {
      previous_probability: previous,
      updated_probability: saved.probability_known,
      mastery: saved,
    };
  }

  private applyEvidence(
    prior: number,
    slip: number,
    guess: number,
    isCorrect: boolean,
  ): number {
    if (isCorrect) {
      const numerator = prior * (1 - slip);
      const denominator = numerator + (1 - prior) * guess;
      return this.clamp(numerator / denominator);
    }

    const numerator = prior * slip;
    const denominator = numerator + (1 - prior) * (1 - guess);
    return this.clamp(numerator / denominator);
  }

  private clamp(value: number): number {
    if (Number.isNaN(value)) {
      return 0.25;
    }
    return Math.min(1, Math.max(0, value));
  }
}
