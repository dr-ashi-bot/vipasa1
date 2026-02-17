import { BadRequestException, Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class VideoService {
  constructor(private readonly amqp: AmqpConnection) {}

  async verify(input: {
    user_id: string;
    video_id: string;
    watch_duration_sec: number;
    video_duration_sec?: number;
    playback_rate?: number;
    skipped?: boolean;
  }) {
    if (!input.video_duration_sec || input.video_duration_sec <= 0) {
      throw new BadRequestException('video_duration_sec is required for verification');
    }

    const pct = input.watch_duration_sec / input.video_duration_sec;
    const normalSpeed = (input.playback_rate ?? 1) === 1;
    const noSkipping = input.skipped !== true;
    const verified = pct >= 0.9 && normalSpeed && noSkipping;

    const xp_delta = verified ? 30 : 0;
    const exchange = process.env.RABBITMQ_EXCHANGE ?? 'vipasa.events';
    await this.amqp.publish(exchange, 'video.verified', {
      user_id: input.user_id,
      video_id: input.video_id,
      watch_duration_sec: input.watch_duration_sec,
      video_duration_sec: input.video_duration_sec,
      playback_rate: input.playback_rate ?? 1,
      skipped: input.skipped ?? false,
      verified,
      xp_delta,
      occurred_at: new Date().toISOString(),
    });

    return { verified, xp_delta, confetti: verified };
  }
}

