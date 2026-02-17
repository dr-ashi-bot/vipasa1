import { Injectable } from "@nestjs/common";
import type { BKTMastery } from "../../entities/bkt-mastery.entity";
import { ELA_CONCEPTS, MATH_CONCEPTS } from "../types";

interface CurriculumPlan {
  recommended_track: "Math" | "ELA";
  math_concept: string;
  ela_concept: string;
  reason: string;
}

@Injectable()
export class CurriculumService {
  buildPlan(masteryRows: BKTMastery[]): CurriculumPlan {
    const lookup = new Map<string, number>();
    for (const row of masteryRows) {
      lookup.set(`${row.track}:${row.concept_id}`, row.probability_known);
    }

    const mathConcept = this.pickLeastMastered("Math", MATH_CONCEPTS, lookup);
    const elaConcept = this.pickLeastMastered("ELA", ELA_CONCEPTS, lookup);

    const mathScore = lookup.get(`Math:${mathConcept}`) ?? 0.25;
    const elaScore = lookup.get(`ELA:${elaConcept}`) ?? 0.25;

    const recommended_track: "Math" | "ELA" = mathScore <= elaScore ? "Math" : "ELA";

    return {
      recommended_track,
      math_concept: mathConcept,
      ela_concept: elaConcept,
      reason:
        recommended_track === "Math"
          ? "Math challenge is primed for discovery-level growth while ELA remains accessible."
          : "ELA support is prioritized to strengthen comprehension while keeping momentum steady.",
    };
  }

  private pickLeastMastered(
    track: "Math" | "ELA",
    concepts: readonly string[],
    lookup: Map<string, number>,
  ): string {
    let selected = concepts[0];
    let lowest = Number.POSITIVE_INFINITY;
    for (const concept of concepts) {
      const probability = lookup.get(`${track}:${concept}`) ?? 0.25;
      if (probability < lowest) {
        lowest = probability;
        selected = concept;
      }
    }
    return selected;
  }
}
