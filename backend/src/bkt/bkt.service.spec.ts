import { BktService } from './bkt.service';
import { SubjectTrack } from '../domain/enums/subject-track.enum';

describe('BktService', () => {
  it('updates probability known upward on correct responses', () => {
    const service = new BktService();
    const first = service.updateMastery(
      '550e8400-e29b-41d4-a716-446655440000',
      SubjectTrack.MATH,
      'math_6_integer_operations',
      true,
    );
    expect(first.probability_known).toBeGreaterThan(0.25);
  });

  it('maintains separate mastery nodes for Math and ELA tracks', () => {
    const service = new BktService();
    const userId = '550e8400-e29b-41d4-a716-446655440001';
    const math = service.updateMastery(
      userId,
      SubjectTrack.MATH,
      'math_6_geometry_3d_solids',
      true,
    );
    const ela = service.updateMastery(
      userId,
      SubjectTrack.ELA,
      'ela_4_main_idea',
      false,
    );

    expect(math.subject).toBe(SubjectTrack.MATH);
    expect(ela.subject).toBe(SubjectTrack.ELA);
    expect(math.concept_id).not.toBe(ela.concept_id);
  });
});
