import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  CONCEPTS_BY_SUBJECT,
  ConceptBlueprint,
} from '../domain/constants/curriculum';
import { SubjectTrack } from '../domain/enums/subject-track.enum';
import { BktMastery } from '../mastery/bkt-mastery.entity';

interface BktParams {
  guess: number;
  slip: number;
  transition: number;
}

@Injectable()
export class BktService {
  private readonly masteryByKey = new Map<string, BktMastery>();
  private readonly params: BktParams = {
    guess: 0.2,
    slip: 0.1,
    transition: 0.18,
  };

  getOptimalLearningPath(user_id: string): {
    recommended_track: SubjectTrack;
    math_next_concept: BktMastery;
    ela_next_concept: BktMastery;
  } {
    const mathNext = this.getWeakestConcept(user_id, SubjectTrack.MATH);
    const elaNext = this.getWeakestConcept(user_id, SubjectTrack.ELA);

    return {
      recommended_track:
        mathNext.probability_known <= elaNext.probability_known
          ? SubjectTrack.MATH
          : SubjectTrack.ELA,
      math_next_concept: mathNext,
      ela_next_concept: elaNext,
    };
  }

  updateMastery(
    user_id: string,
    subject: SubjectTrack,
    concept_id: string,
    is_correct: boolean,
  ): BktMastery {
    const mastery = this.getOrCreateMastery(user_id, subject, concept_id);
    const posterior = this.posteriorKnown(mastery.probability_known, is_correct);
    const nextProbability =
      posterior + (1 - posterior) * this.params.transition;

    mastery.probability_known = Number(nextProbability.toFixed(6));
    mastery.opportunities += 1;
    mastery.last_response_correct = is_correct;
    this.masteryByKey.set(this.key(user_id, subject, concept_id), mastery);

    return mastery;
  }

  getConceptBlueprint(
    concept_id: string,
    subject: SubjectTrack,
  ): ConceptBlueprint | null {
    return (
      CONCEPTS_BY_SUBJECT[subject].find(
        (concept) => concept.concept_id === concept_id,
      ) ?? null
    );
  }

  private getWeakestConcept(user_id: string, subject: SubjectTrack): BktMastery {
    return CONCEPTS_BY_SUBJECT[subject]
      .map((concept) => this.getOrCreateMastery(user_id, subject, concept.concept_id))
      .sort((a, b) => a.probability_known - b.probability_known)[0];
  }

  private getOrCreateMastery(
    user_id: string,
    subject: SubjectTrack,
    concept_id: string,
  ): BktMastery {
    const key = this.key(user_id, subject, concept_id);
    const existing = this.masteryByKey.get(key);

    if (existing) {
      return existing;
    }

    const created: BktMastery = {
      mastery_id: randomUUID(),
      user_id,
      concept_id,
      subject,
      probability_known: 0.25,
      opportunities: 0,
      last_response_correct: null,
    };
    this.masteryByKey.set(key, created);
    return created;
  }

  private posteriorKnown(prior: number, isCorrect: boolean): number {
    const { slip, guess } = this.params;
    const pKnown = Math.max(0.001, Math.min(0.999, prior));

    if (isCorrect) {
      return (pKnown * (1 - slip)) / (pKnown * (1 - slip) + (1 - pKnown) * guess);
    }

    return (pKnown * slip) / (pKnown * slip + (1 - pKnown) * (1 - guess));
  }

  private key(user_id: string, subject: SubjectTrack, concept_id: string): string {
    return `${user_id}:${subject}:${concept_id}`;
  }
}
