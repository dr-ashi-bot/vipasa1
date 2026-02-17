import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { GamificationService } from '../gamification.service';
import { GamificationState } from '../schemas/gamification-state.schema';
import { XPEvent } from '../schemas/xp-event.schema';
import { Leaderboard } from '../schemas/leaderboard.schema';
import { League } from '../../common/enums/league.enum';

describe('GamificationService', () => {
  let service: GamificationService;

  const mockState = {
    user_id: 'test-user-id',
    current_streak: 3,
    longest_streak: 5,
    streak_freezes: 1,
    total_xp: 100,
    weekly_xp: 50,
    current_league: League.BRONZE,
    consecutive_correct: 0,
    confetti_opacity: 1.0,
    confetti_frequency: 1.0,
    last_activity_date: new Date(),
    daily_quests: {},
    monthly_quest: {},
    save: jest.fn().mockResolvedValue(undefined),
  };

  const mockGamificationModel = {
    findOne: jest.fn().mockResolvedValue(mockState),
    create: jest.fn().mockResolvedValue(mockState),
  };

  const mockXPEventModel = {
    create: jest.fn().mockResolvedValue({}),
  };

  const mockLeaderboardModel = {
    findOne: jest.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockGamificationModel.findOne.mockResolvedValue({ ...mockState, save: jest.fn().mockResolvedValue(undefined) });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamificationService,
        {
          provide: getModelToken(GamificationState.name),
          useValue: mockGamificationModel,
        },
        {
          provide: getModelToken(XPEvent.name),
          useValue: mockXPEventModel,
        },
        {
          provide: getModelToken(Leaderboard.name),
          useValue: mockLeaderboardModel,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('5'),
          },
        },
      ],
    }).compile();

    service = module.get<GamificationService>(GamificationService);
  });

  describe('Flow State Confetti Logic', () => {
    it('should maintain full confetti below flow threshold', async () => {
      const state = {
        ...mockState,
        consecutive_correct: 2,
        confetti_opacity: 1.0,
        confetti_frequency: 1.0,
        save: jest.fn().mockResolvedValue(undefined),
      };
      mockGamificationModel.findOne.mockResolvedValue(state);

      const result = await service.handleCorrectAnswer(
        'test-user-id',
        'math_6_integers',
      );

      expect(result.confetti_opacity).toBe(1.0);
      expect(result.confetti_frequency).toBe(1.0);
      expect(result.show_confetti).toBe(true);
    });

    it('should fade confetti after flow threshold (5 consecutive)', async () => {
      const state = {
        ...mockState,
        consecutive_correct: 6,
        confetti_opacity: 1.0,
        confetti_frequency: 1.0,
        save: jest.fn().mockResolvedValue(undefined),
      };
      mockGamificationModel.findOne.mockResolvedValue(state);

      const result = await service.handleCorrectAnswer(
        'test-user-id',
        'math_6_integers',
      );

      // After 7 consecutive (6+1), overshoot is 2
      // opacity = max(0.1, 1.0 - 2*0.15) = 0.7
      expect(result.confetti_opacity).toBeLessThan(1.0);
      expect(result.confetti_frequency).toBeLessThan(1.0);
    });

    it('should reset flow state on incorrect answer', async () => {
      const state = {
        ...mockState,
        consecutive_correct: 8,
        confetti_opacity: 0.3,
        confetti_frequency: 0.4,
        save: jest.fn().mockResolvedValue(undefined),
      };
      mockGamificationModel.findOne.mockResolvedValue(state);

      await service.handleIncorrectAnswer('test-user-id');

      expect(state.consecutive_correct).toBe(0);
      expect(state.confetti_opacity).toBe(1.0);
      expect(state.confetti_frequency).toBe(1.0);
    });
  });

  describe('XP Awards', () => {
    it('should award base XP for correct answer', async () => {
      const state = {
        ...mockState,
        consecutive_correct: 0,
        total_xp: 100,
        weekly_xp: 50,
        save: jest.fn().mockResolvedValue(undefined),
      };
      mockGamificationModel.findOne.mockResolvedValue(state);

      const result = await service.handleCorrectAnswer(
        'test-user-id',
        'math_6_integers',
      );

      expect(result.xp_earned).toBe(10);
    });

    it('should award streak bonus after 3+ consecutive', async () => {
      const state = {
        ...mockState,
        consecutive_correct: 3,
        total_xp: 100,
        weekly_xp: 50,
        save: jest.fn().mockResolvedValue(undefined),
      };
      mockGamificationModel.findOne.mockResolvedValue(state);

      const result = await service.handleCorrectAnswer(
        'test-user-id',
        'math_6_integers',
      );

      expect(result.xp_earned).toBe(15); // 10 base + 5 streak bonus
    });
  });

  describe('League System', () => {
    it('should have 10 league tiers defined', () => {
      const leagues = Object.values(League);
      expect(leagues).toHaveLength(10);
      expect(leagues).toContain('Bronze');
      expect(leagues).toContain('Diamond');
    });
  });
});
