import { Injectable } from "@nestjs/common";
import type { VideoVerifyDto } from "../dto/video-verify.dto";

@Injectable()
export class VideoVerificationService {
  verify(payload: VideoVerifyDto): {
    verified: boolean;
    completion_ratio: number;
    xp_delta: number;
    reason: string;
  } {
    const completion_ratio = payload.watch_duration_sec / payload.video_duration_sec;
    const normalSpeed = payload.playback_rate_avg >= 0.95 && payload.playback_rate_avg <= 1.05;
    const noSkipping = payload.seek_events === 0;
    const watchedEnough = completion_ratio >= 0.9;
    const verified = watchedEnough && normalSpeed && noSkipping;

    if (verified) {
      return {
        verified: true,
        completion_ratio,
        xp_delta: 35,
        reason: ">=90% watched at normal speed without skipping.",
      };
    }

    const reasonParts: string[] = [];
    if (!watchedEnough) reasonParts.push("watch ratio below 90%");
    if (!normalSpeed) reasonParts.push("playback speed not normal");
    if (!noSkipping) reasonParts.push("seeking detected");

    return {
      verified: false,
      completion_ratio,
      xp_delta: 0,
      reason: reasonParts.join("; "),
    };
  }
}
