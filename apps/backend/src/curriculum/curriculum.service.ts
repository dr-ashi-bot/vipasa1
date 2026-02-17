import { Injectable } from '@nestjs/common';
import { UserProfileEntity } from '../db/postgres/user-profile.entity';

@Injectable()
export class CurriculumService {
  mathConcepts(level: number): string[] {
    // MVP: a small but 6th-grade-targeted concept set.
    if (level >= 6) {
      return [
        'math_6_integers_operations',
        'math_6_equations_multistep',
        'math_6_geometry_solids_volume',
      ];
    }
    return ['math_5_integers_intro'];
  }

  elaConcepts(level: number): string[] {
    // MVP: 4th-grade reading/writing remediation-friendly concepts.
    if (level >= 4) {
      return ['ela_4_reading_main_idea', 'ela_4_vocab_context_clues'];
    }
    return ['ela_3_reading_details'];
  }

  candidateConceptsForTrack(user: UserProfileEntity, track: 'math' | 'ela'): string[] {
    return track === 'math'
      ? this.mathConcepts(user.math_level)
      : this.elaConcepts(user.ela_level);
  }
}

