import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ProgressService, ProgressSubmissionDto } from './progress.service';
import { BKTEngine } from './bkt-engine.service';

@Controller('progress')
export class ProgressController {
  constructor(
    private readonly progressService: ProgressService,
    private readonly bktEngine: BKTEngine,
  ) {}

  @Post('submit')
  async submitProgress(@Body() submission: ProgressSubmissionDto) {
    return this.progressService.submitProgress(submission);
  }

  @Get('mastery/:user_id')
  async getUserMastery(@Param('user_id') user_id: string) {
    return this.bktEngine.getUserMastery(user_id);
  }

  @Get('stats/:user_id')
  async getUserStats(@Param('user_id') user_id: string) {
    return this.progressService.getUserMasteryStats(user_id);
  }

  @Get('recommend/:user_id/:domain')
  async recommendConcepts(
    @Param('user_id') user_id: string,
    @Param('domain') domain: 'math' | 'ela',
  ) {
    const concepts = await this.bktEngine.recommendConcepts(user_id, domain, 3);
    return { concepts };
  }
}
