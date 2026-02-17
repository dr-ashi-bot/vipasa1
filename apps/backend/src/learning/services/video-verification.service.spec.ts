import { VideoVerificationService } from "./video-verification.service";

describe("VideoVerificationService", () => {
  const service = new VideoVerificationService();

  it("verifies playback when >=90% watched at normal speed without skipping", () => {
    const result = service.verify({
      user_id: "3b62c7ff-12f7-4f62-9b8f-0baf2fc64998",
      video_id: "abc123",
      watch_duration_sec: 540,
      video_duration_sec: 600,
      playback_rate_avg: 1,
      seek_events: 0,
    });

    expect(result.verified).toBe(true);
    expect(result.xp_delta).toBeGreaterThan(0);
  });

  it("rejects playback when skipping is detected", () => {
    const result = service.verify({
      user_id: "3b62c7ff-12f7-4f62-9b8f-0baf2fc64998",
      video_id: "abc123",
      watch_duration_sec: 600,
      video_duration_sec: 600,
      playback_rate_avg: 1,
      seek_events: 2,
    });

    expect(result.verified).toBe(false);
    expect(result.xp_delta).toBe(0);
    expect(result.reason).toContain("seeking");
  });
});
