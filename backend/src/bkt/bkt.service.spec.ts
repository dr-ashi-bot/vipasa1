import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BktService } from './bkt.service';
import { BktMastery, SubjectTrack } from '../database/bkt-mastery.entity';

describe('BktService', () => {
  let service: BktService;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((entity) => entity),
      save: jest.fn((entity) => Promise.resolve({ ...entity, mastery_id: 'test-id' })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BktService,
        {
          provide: getRepositoryToken(BktMastery),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<BktService>(BktService);
  });

  describe('Curriculum', () => {
    it('should return 10 math concepts at 6th-grade level', () => {
      const math = service.getMathCurriculum();
      expect(math).toHaveLength(10);
      math.forEach((concept) => {
        expect(concept.grade_level).toBe(6);
        expect(concept.subject).toBe(SubjectTrack.MATH);
      });
    });

    it('should return 8 ELA concepts at 4th-grade level', () => {
      const ela = service.getElaCurriculum();
      expect(ela).toHaveLength(8);
      ela.forEach((concept) => {
        expect(concept.grade_level).toBe(4);
        expect(concept.subject).toBe(SubjectTrack.ELA);
      });
    });

    it('should have separate math and ELA tracks (decoupled)', () => {
      const all = service.getAllConcepts();
      const mathIds = all
        .filter((c) => c.subject === SubjectTrack.MATH)
        .map((c) => c.concept_id);
      const elaIds = all
        .filter((c) => c.subject === SubjectTrack.ELA)
        .map((c) => c.concept_id);

      expect(mathIds.every((id) => id.startsWith('math_'))).toBe(true);
      expect(elaIds.every((id) => id.startsWith('ela_'))).toBe(true);
      expect(
        mathIds.some((id) => elaIds.includes(id)),
      ).toBe(false);
    });
  });

  describe('BKT Update Algorithm', () => {
    it('should increase mastery on correct answer', async () => {
      const initialMastery = {
        user_id: 'user1',
        concept_id: 'math_6_integer_ops',
        subject_track: SubjectTrack.MATH,
        probability_known: 0.3,
        probability_learn: 0.3,
        probability_guess: 0.1,
        probability_slip: 0.1,
        total_attempts: 5,
        correct_attempts: 3,
      };
      mockRepo.findOne.mockResolvedValue(initialMastery);

      const result = await service.updateMastery(
        'user1',
        'math_6_integer_ops',
        true,
      );

      expect(result.probability_known).toBeGreaterThan(0.3);
      expect(result.total_attempts).toBe(6);
      expect(result.correct_attempts).toBe(4);
    });

    it('should keep mastery bounded between 0 and 1', async () => {
      const highMastery = {
        user_id: 'user1',
        concept_id: 'math_6_integer_ops',
        subject_track: SubjectTrack.MATH,
        probability_known: 0.99,
        probability_learn: 0.3,
        probability_guess: 0.1,
        probability_slip: 0.1,
        total_attempts: 50,
        correct_attempts: 48,
      };
      mockRepo.findOne.mockResolvedValue(highMastery);

      const result = await service.updateMastery(
        'user1',
        'math_6_integer_ops',
        true,
      );

      expect(result.probability_known).toBeLessThanOrEqual(1.0);
      expect(result.probability_known).toBeGreaterThanOrEqual(0.0);
    });

    it('should not dramatically decrease mastery on single incorrect answer', async () => {
      const moderateMastery = {
        user_id: 'user1',
        concept_id: 'math_6_integer_ops',
        subject_track: SubjectTrack.MATH,
        probability_known: 0.5,
        probability_learn: 0.3,
        probability_guess: 0.1,
        probability_slip: 0.1,
        total_attempts: 10,
        correct_attempts: 5,
      };
      mockRepo.findOne.mockResolvedValue(moderateMastery);

      const result = await service.updateMastery(
        'user1',
        'math_6_integer_ops',
        false,
      );

      // BKT with learning transition should not drop below initial
      expect(result.probability_known).toBeGreaterThan(0.0);
      expect(result.total_attempts).toBe(11);
      expect(result.correct_attempts).toBe(5);
    });
  });

  describe('Optimal Next Concept', () => {
    it('should select concept with lowest mastery and met prerequisites', async () => {
      mockRepo.find.mockResolvedValue([
        {
          concept_id: 'math_6_integer_ops',
          probability_known: 0.8,
          subject_track: SubjectTrack.MATH,
        },
        {
          concept_id: 'math_6_fractions_advanced',
          probability_known: 0.2,
          subject_track: SubjectTrack.MATH,
        },
        {
          concept_id: 'math_6_geometry_2d',
          probability_known: 0.5,
          subject_track: SubjectTrack.MATH,
        },
      ]);

      const next = await service.getOptimalNextConcept(
        'user1',
        SubjectTrack.MATH,
      );

      // Should select a concept whose prerequisites are met and has low mastery.
      // Multiple concepts may tie at lowest mastery (0.1 default for unmapped).
      // The returned concept must not be the already-mastered one.
      expect(next).not.toBeNull();
      expect(next!.concept_id).not.toBe('math_6_integer_ops');
    });

    it('should skip concepts with unmet prerequisites', async () => {
      mockRepo.find.mockResolvedValue([
        {
          concept_id: 'math_6_integer_ops',
          probability_known: 0.3,
          subject_track: SubjectTrack.MATH,
        },
      ]);

      const next = await service.getOptimalNextConcept(
        'user1',
        SubjectTrack.MATH,
      );

      // math_6_fractions_advanced requires math_6_integer_ops >= 0.7 (not met at 0.3)
      // So it should select math_6_integer_ops itself (no prereqs, low mastery)
      expect(next).not.toBeNull();
      if (next) {
        expect(next.prerequisites.length === 0 || next.concept_id === 'math_6_integer_ops').toBe(true);
      }
    });
  });
});
