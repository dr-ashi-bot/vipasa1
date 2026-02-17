import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SessionService } from './session.service';
import { StartSessionDto } from './dto/start-session.dto';

@ApiTags('Session')
@Controller('api/session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  /**
   * POST /api/session/start
   * Initializes the visual timer and queries BKT for optimal learning path.
   */
  @Post('start')
  @ApiOperation({
    summary: 'Start a new learning session',
    description:
      'Initializes the immutable visual timer (15-20 min), queries BKT engine for optimal learning path, updates streak, and generates daily quests.',
  })
  @ApiResponse({
    status: 201,
    description: 'Session started with learning path and timer data',
  })
  async startSession(@Body() dto: StartSessionDto) {
    return this.sessionService.startSession(dto);
  }

  /**
   * GET /api/session/status/:userId
   * Get remaining time and session status (Zeigarnik enforcement).
   */
  @Get('status/:userId')
  @ApiOperation({
    summary: 'Get session status and remaining time',
    description:
      'Returns visual timer progress. Once expired, triggers Zeigarnik Effect cutoff.',
  })
  getSessionStatus(@Param('userId', ParseUUIDPipe) userId: string) {
    const remaining = this.sessionService.getRemainingTime(userId);
    return {
      is_active: this.sessionService.isSessionActive(userId),
      ...remaining,
      zeigarnik_message: remaining.is_expired
        ? "Great work today! Your brain needs rest to grow stronger. Come back tomorrow to continue the adventure!"
        : null,
    };
  }

  /**
   * POST /api/session/end/:userId
   * End the session manually.
   */
  @Post('end/:userId')
  @ApiOperation({ summary: 'End the current session' })
  async endSession(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.sessionService.endSession(userId);
  }
}
