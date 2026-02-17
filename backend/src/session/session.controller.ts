import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { SessionService } from './session.service';
import { SubjectTrack } from '../database/bkt-mastery.entity';

class StartSessionDto {
  user_id: string;
  preferred_track?: 'math' | 'ela';
  duration_minutes?: number;
}

@ApiTags('session')
@Controller('api/session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post('start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Start a learning session with visual timer and BKT-optimized path',
  })
  @ApiBody({ type: StartSessionDto })
  async startSession(@Body() body: StartSessionDto) {
    if (!body.user_id) {
      throw new BadRequestException('user_id is required');
    }

    const track = body.preferred_track
      ? body.preferred_track === 'math'
        ? SubjectTrack.MATH
        : SubjectTrack.ELA
      : undefined;

    return this.sessionService.startSession(
      body.user_id,
      track,
      body.duration_minutes,
    );
  }

  @Get(':sessionId/timer')
  @ApiOperation({
    summary: 'Get visual timer progress for puppy walk / gymnast routine',
  })
  async getTimer(@Param('sessionId') sessionId: string) {
    return this.sessionService.getTimerProgress(sessionId);
  }

  @Post(':sessionId/end')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'End a learning session (Zeigarnik Effect cutoff)',
  })
  async endSession(@Param('sessionId') sessionId: string) {
    return this.sessionService.endSession(sessionId);
  }
}
