import { Body, Controller, Post } from '@nestjs/common';
import { StartSessionDto } from './dto/start-session.dto';
import { SessionService } from './session.service';
import { UserService } from '../user/user.service';

@Controller('session')
export class SessionController {
  constructor(
    private readonly sessions: SessionService,
    private readonly users: UserService,
  ) {}

  @Post('start')
  async start(@Body() dto: StartSessionDto) {
    const duration_sec = dto.duration_sec ?? 1200; // 20 minutes (pre-teen friendly focus block)
    const preferred_track = dto.preferred_track ?? 'math';

    const user = await this.users.getOrCreateUser(dto.user_id);
    const { session, next } = await this.sessions.startSession({
      user_id: dto.user_id,
      duration_sec,
      preferred_track,
    });

    return {
      session_id: session.session_id,
      user: {
        user_id: user.user_id,
        first_name: user.first_name,
        thematic_interests: user.thematic_interests,
        math_level: user.math_level,
        ela_level: user.ela_level,
      },
      timer: {
        duration_sec,
        visual: {
          type: 'puppy_walk',
          // UI renders progress; backend deliberately avoids digits-only countdown UX.
          total_steps: 60,
        },
        ends_at: session.ends_at.toISOString(),
      },
      next,
    };
  }
}

