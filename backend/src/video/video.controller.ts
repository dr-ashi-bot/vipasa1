import { Body, Controller, Post } from '@nestjs/common';
import { VideoService } from './video.service';
import { GamificationService } from '../gamification/gamification.service';

class VerifyVideoDto {
  user_id: string;
  video_duration_sec: number;
  watch_duration_sec: number;
}

@Controller('api/video')
export class VideoController {
  constructor(
    private videoService: VideoService,
    private gamificationService: GamificationService,
  ) {}

  @Post('verify')
  async verify(@Body() dto: VerifyVideoDto) {
    const { valid, xpAward } = this.videoService.verifyWatch(
      dto.video_duration_sec,
      dto.watch_duration_sec,
    );

    if (valid && xpAward > 0) {
      await this.gamificationService.awardXp(dto.user_id, xpAward);
    }

    return {
      valid,
      xp_awarded: valid ? xpAward : 0,
      trigger_confetti: valid,
    };
  }
}
