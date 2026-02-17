import { SubjectTrack } from '../enums/subject-track.enum';

export interface ConceptBlueprint {
  concept_id: string;
  subject: SubjectTrack;
  prompt_hint: string;
}

export const MATH_GRADE6_CONCEPTS: readonly ConceptBlueprint[] = [
  {
    concept_id: 'math_6_geometry_3d_solids',
    subject: SubjectTrack.MATH,
    prompt_hint:
      '3D solids, nets, and volume with puzzle-style reasoning steps.',
  },
  {
    concept_id: 'math_6_integer_operations',
    subject: SubjectTrack.MATH,
    prompt_hint:
      'Integer operations in context, including signed values and number lines.',
  },
  {
    concept_id: 'math_6_multi_step_equations',
    subject: SubjectTrack.MATH,
    prompt_hint:
      'Multi-step equations with variables on both sides and logical deduction.',
  },
  {
    concept_id: 'math_6_ratio_reasoning',
    subject: SubjectTrack.MATH,
    prompt_hint: 'Ratio and proportional reasoning with discovery-oriented tasks.',
  },
];

export const ELA_GRADE4_CONCEPTS: readonly ConceptBlueprint[] = [
  {
    concept_id: 'ela_4_main_idea',
    subject: SubjectTrack.ELA,
    prompt_hint: 'Main idea and key details in short decodable passages.',
  },
  {
    concept_id: 'ela_4_context_clues',
    subject: SubjectTrack.ELA,
    prompt_hint: 'Context clues with simple sentence structures and clear vocabulary.',
  },
  {
    concept_id: 'ela_4_sentence_combining',
    subject: SubjectTrack.ELA,
    prompt_hint:
      'Sentence combining and revision using grade-4 readability constraints.',
  },
  {
    concept_id: 'ela_4_inference_basics',
    subject: SubjectTrack.ELA,
    prompt_hint:
      'Inference from short text while maintaining highly decodable words.',
  },
];

export const CONCEPTS_BY_SUBJECT: Readonly<
  Record<SubjectTrack, readonly ConceptBlueprint[]>
> = {
  [SubjectTrack.MATH]: MATH_GRADE6_CONCEPTS,
  [SubjectTrack.ELA]: ELA_GRADE4_CONCEPTS,
};
