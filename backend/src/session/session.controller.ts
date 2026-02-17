import { Body, Controller, Post } from '@nestjs/common';
import { SessionService } from './session.service';

class StartSessionDto {
  user_id: string;
}

@Controller('api/session')
export class SessionController {
  constructor(private sessionService: SessionService) {}

  @Post('start')
  async start(@Body() dto: StartSessionDto) {
    const result = await this.sessionService.startSession(dto.user_id);
    return {
      session_id: result.sessionId,
      duration_minutes: result.durationMinutes,
      math_concepts: result.mathConcepts,
      ela_concepts: result.elaConcepts,
      expires_at: result.expiresAt.toISOString(),
    };
  }
}
