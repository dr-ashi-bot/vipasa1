import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { VideoService } from '../video.service';
import { GamificationService } from '../../gamification/gamification.service';

describe('VideoService', () => {
  let service: VideoService;
  let gamificationService: jest.Mocked<Partial<GamificationService>>;

  beforeEach(async () => {
    gamificationService = {
      awardVideoXP: jest.fn().mockResolvedValue({
        xp_earned: 25,
        total_xp: 125,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('0.9'),
          },
        },
        {
          provide: GamificationService,
          useValue: gamificationService,
        },
      ],
    }).compile();

    service = module.get<VideoService>(VideoService);
  });

  describe('Anti-Cheat Verification', () => {
    it('should verify and award XP when 90%+ watched at normal speed', async () => {
      const result = await service.verifyAndReward({
        user_id: 'test-user-id',
        video_id: 'test-video',
        watch_duration_sec: 270,
        total_duration_sec: 300,
        playback_rate: 1.0,
      });

      expect(result.verified).toBe(true);
      expect(result.xp_earned).toBe(25);
      expect(result.show_confetti).toBe(true);
    });

    it('should reject when less than 90% watched', async () => {
      const result = await service.verifyAndReward({
        user_id: 'test-user-id',
        video_id: 'test-video-2',
        watch_duration_sec: 100,
        total_duration_sec: 300,
        playback_rate: 1.0,
      });

      expect(result.verified).toBe(false);
      expect(result.xp_earned).toBe(0);
      expect(result.reason).toContain('90%');
    });

    it('should reject when playback rate is above normal', async () => {
      const result = await service.verifyAndReward({
        user_id: 'test-user-id',
        video_id: 'test-video-3',
        watch_duration_sec: 280,
        total_duration_sec: 300,
        playback_rate: 2.0,
      });

      expect(result.verified).toBe(false);
      expect(result.xp_earned).toBe(0);
      expect(result.reason).toContain('normal speed');
    });

    it('should prevent double-claiming XP for same video', async () => {
      // First claim should succeed
      const first = await service.verifyAndReward({
        user_id: 'test-user-id',
        video_id: 'test-video-double',
        watch_duration_sec: 280,
        total_duration_sec: 300,
        playback_rate: 1.0,
      });
      expect(first.verified).toBe(true);

      // Second claim should fail
      const second = await service.verifyAndReward({
        user_id: 'test-user-id',
        video_id: 'test-video-double',
        watch_duration_sec: 280,
        total_duration_sec: 300,
        playback_rate: 1.0,
      });
      expect(second.verified).toBe(false);
      expect(second.reason).toContain('already claimed');
    });

    it('should reject suspicious timing', async () => {
      const result = await service.verifyAndReward({
        user_id: 'test-user-id',
        video_id: 'test-video-4',
        watch_duration_sec: 50,
        total_duration_sec: 300,
        playback_rate: 1.0,
      });

      expect(result.verified).toBe(false);
    });
  });

  describe('Video Recommendations', () => {
    it('should return videos for known concepts', () => {
      const videos = service.getVideoRecommendations('math_6_integers');
      expect(videos.length).toBeGreaterThan(0);
      expect(videos[0]).toHaveProperty('video_id');
      expect(videos[0]).toHaveProperty('khan_academy_url');
    });

    it('should return fallback for unknown concepts', () => {
      const videos = service.getVideoRecommendations('unknown_concept');
      expect(videos.length).toBeGreaterThan(0);
    });
  });
});
