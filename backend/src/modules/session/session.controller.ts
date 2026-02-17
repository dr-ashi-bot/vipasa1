import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { SessionService, StartSessionDto } from './session.service';

@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post('start')
  async startSession(@Body() dto: StartSessionDto) {
    return this.sessionService.startSession(dto);
  }

  @Get('active/:user_id')
  async getActiveSession(@Param('user_id') user_id: string) {
    const session = await this.sessionService.getActiveSession(user_id);
    return { session };
  }

  @Get('expiry/:session_id')
  async checkExpiry(@Param('session_id') session_id: string) {
    return this.sessionService.checkSessionExpiry(session_id);
  }

  @Post('end/:session_id')
  async endSession(@Param('session_id') session_id: string) {
    return this.sessionService.endSession(session_id);
  }
}
