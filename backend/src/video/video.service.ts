import { Injectable } from '@nestjs/common';

const MIN_WATCH_PERCENT = 0.9;

@Injectable()
export class VideoService {
  /**
   * Verify that user watched at least 90% of video at normal speed.
   * Uses getDuration() and getCurrentTime() delta from YouTube API.
   */
  verifyWatch(
    videoDurationSec: number,
    watchDurationSec: number,
  ): { valid: boolean; xpAward: number } {
    if (videoDurationSec <= 0) {
      return { valid: false, xpAward: 0 };
    }
    const watchPercent = watchDurationSec / videoDurationSec;
    const valid = watchPercent >= MIN_WATCH_PERCENT;
    const xpAward = valid ? Math.floor(videoDurationSec / 60) * 5 : 0;
    return { valid, xpAward };
  }
}
