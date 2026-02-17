import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { VideoService } from './video.service';
import { GamificationService } from '../gamification/gamification.service';
import { GamificationState } from '../database/gamification-state.schema';
import { XpEvent } from '../database/xp-event.schema';

describe('VideoService', () => {
  let service: VideoService;
  let gamificationService: GamificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoService,
        GamificationService,
        {
          provide: getModelToken(GamificationState.name),
          useValue: {
            findOne: jest.fn().mockResolvedValue({
              user_id: 'user1',
              total_xp: 100,
              weekly_xp: 50,
              save: jest.fn().mockImplementation(function () {
                return Promise.resolve(this);
              }),
            }),
            create: jest.fn(),
          },
        },
        {
          provide: getModelToken(XpEvent.name),
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<VideoService>(VideoService);
    gamificationService = module.get<GamificationService>(GamificationService);
  });

  describe('Anti-Cheat Video Verification', () => {
    it('should reject videos watched less than 90%', async () => {
      const result = await service.verifyVideoCompletion({
        user_id: 'user1',
        video_id: 'vid1',
        video_duration_sec: 300,
        watch_duration_sec: 200,
        start_time: 1000,
        end_time: 1200,
      });

      expect(result.verified).toBe(false);
      expect(result.xp_awarded).toBe(0);
      expect(result.reason).toContain('90%');
    });

    it('should reject videos played at high speed', async () => {
      const result = await service.verifyVideoCompletion({
        user_id: 'user1',
        video_id: 'vid1',
        video_duration_sec: 300,
        watch_duration_sec: 280,
        start_time: 1000,
        end_time: 1100,
      });

      expect(result.verified).toBe(false);
      expect(result.xp_awarded).toBe(0);
    });

    it('should verify and award XP for legitimately watched video', async () => {
      const result = await service.verifyVideoCompletion({
        user_id: 'user1',
        video_id: 'vid1',
        video_duration_sec: 300,
        watch_duration_sec: 290,
        start_time: 1000,
        end_time: 1295,
      });

      expect(result.verified).toBe(true);
      expect(result.xp_awarded).toBe(15);
      expect(result.show_confetti).toBe(true);
    });

    it('should reject suspiciously short wall clock time', async () => {
      const result = await service.verifyVideoCompletion({
        user_id: 'user1',
        video_id: 'vid1',
        video_duration_sec: 300,
        watch_duration_sec: 295,
        start_time: 1000,
        end_time: 1050,
      });

      expect(result.verified).toBe(false);
    });
  });

  describe('Video Recommendations', () => {
    it('should return videos for known concept IDs', () => {
      const videos = service.getVideoRecommendations('math_6_integer_ops');
      expect(videos.length).toBeGreaterThan(0);
      expect(videos[0]).toHaveProperty('youtube_id');
      expect(videos[0]).toHaveProperty('duration_sec');
    });

    it('should return empty array for unknown concept', () => {
      const videos = service.getVideoRecommendations('unknown_concept');
      expect(videos).toEqual([]);
    });
  });
});
