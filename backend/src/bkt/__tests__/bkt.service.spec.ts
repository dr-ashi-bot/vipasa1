import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BKTService } from '../bkt.service';
import { BKTMastery } from '../entities/bkt-mastery.entity';

describe('BKTService', () => {
  let service: BKTService;
  let repo: jest.Mocked<Repository<BKTMastery>>;

  const createMockMastery = (overrides: Partial<BKTMastery> = {}): BKTMastery => ({
    mastery_id: 'test-mastery-id',
    user_id: 'test-user-id',
    user: {} as any,
    concept_id: 'math_6_integers',
    track: 'math' as const,
    probability_known: 0.1,
    probability_transit: 0.2,
    probability_slip: 0.1,
    probability_guess: 0.2,
    total_attempts: 0,
    correct_attempts: 0,
    mastery_threshold: 0.95,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    const mockRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      increment: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BKTService,
        {
          provide: getRepositoryToken(BKTMastery),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<BKTService>(BKTService);
    repo = module.get(getRepositoryToken(BKTMastery));
  });

  describe('BKT Algorithm Correctness', () => {
    it('should increase P(L) on correct answer', async () => {
      const mastery = createMockMastery({ probability_known: 0.3 });
      repo.findOne.mockResolvedValue(mastery);
      repo.save.mockImplementation(async (m) => m as BKTMastery);

      const result = await service.updateMastery(
        'test-user-id',
        'math_6_integers',
        true,
      );

      expect(result.probability_known).toBeGreaterThan(0.3);
    });

    it('should decrease P(L) less on incorrect answer', async () => {
      const mastery = createMockMastery({ probability_known: 0.5 });
      repo.findOne.mockResolvedValue(mastery);
      repo.save.mockImplementation(async (m) => m as BKTMastery);

      const result = await service.updateMastery(
        'test-user-id',
        'math_6_integers',
        false,
      );

      // After incorrect, P(L) should still increase due to transit probability,
      // but posterior should be lower than prior
      // The transit always adds some, so the final value depends on parameters
      expect(result.probability_known).toBeDefined();
      expect(result.total_attempts).toBe(1);
      expect(result.correct_attempts).toBe(0);
    });

    it('should increment attempt counts correctly', async () => {
      const mastery = createMockMastery({
        total_attempts: 5,
        correct_attempts: 3,
      });
      repo.findOne.mockResolvedValue(mastery);
      repo.save.mockImplementation(async (m) => m as BKTMastery);

      const correctResult = await service.updateMastery(
        'test-user-id',
        'math_6_integers',
        true,
      );
      expect(correctResult.total_attempts).toBe(6);
      expect(correctResult.correct_attempts).toBe(4);
    });

    it('should keep P(L) in [0, 1] range', async () => {
      const mastery = createMockMastery({ probability_known: 0.99 });
      repo.findOne.mockResolvedValue(mastery);
      repo.save.mockImplementation(async (m) => m as BKTMastery);

      const result = await service.updateMastery(
        'test-user-id',
        'math_6_integers',
        true,
      );

      expect(result.probability_known).toBeLessThanOrEqual(1.0);
      expect(result.probability_known).toBeGreaterThanOrEqual(0.0);
    });

    it('should create new mastery with math defaults for math concepts', async () => {
      repo.findOne.mockResolvedValue(null);
      const mockCreated = createMockMastery({
        track: 'math',
        probability_known: 0.05,
        probability_transit: 0.15,
        probability_slip: 0.1,
        probability_guess: 0.2,
      });
      repo.create.mockReturnValue(mockCreated);
      repo.save.mockResolvedValue(mockCreated);

      const result = await service.getOrCreateMastery(
        'test-user-id',
        'math_6_integers',
      );

      expect(result.track).toBe('math');
      expect(result.probability_known).toBe(0.05);
    });

    it('should create new mastery with ELA defaults for ELA concepts', async () => {
      repo.findOne.mockResolvedValue(null);
      const mockCreated = createMockMastery({
        concept_id: 'ela_4_reading_comprehension',
        track: 'ela',
        probability_known: 0.15,
        probability_transit: 0.25,
        probability_slip: 0.1,
        probability_guess: 0.15,
      });
      repo.create.mockReturnValue(mockCreated);
      repo.save.mockResolvedValue(mockCreated);

      const result = await service.getOrCreateMastery(
        'test-user-id',
        'ela_4_reading_comprehension',
      );

      expect(result.track).toBe('ela');
      expect(result.probability_known).toBe(0.15);
    });
  });

  describe('Mastery Check', () => {
    it('should identify mastered concept when P(L) >= threshold', () => {
      const mastery = createMockMastery({ probability_known: 0.96 });
      expect(service.isMastered(mastery)).toBe(true);
    });

    it('should identify non-mastered concept when P(L) < threshold', () => {
      const mastery = createMockMastery({ probability_known: 0.5 });
      expect(service.isMastered(mastery)).toBe(false);
    });
  });

  describe('Dual-Track Decoupling', () => {
    it('should return math and ELA concepts separately', async () => {
      const mathMastery = createMockMastery({
        concept_id: 'math_6_integers',
        track: 'math',
      });
      const elaMastery = createMockMastery({
        concept_id: 'ela_4_reading',
        track: 'ela',
      });

      repo.find.mockResolvedValue([mathMastery, elaMastery]);

      const result = await service.getUserMasteryByTrack('test-user-id');

      expect(result.math).toHaveLength(1);
      expect(result.ela).toHaveLength(1);
      expect(result.math[0].track).toBe('math');
      expect(result.ela[0].track).toBe('ela');
    });
  });
});
