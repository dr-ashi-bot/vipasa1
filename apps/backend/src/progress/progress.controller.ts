import { Body, Controller, Post } from '@nestjs/common';
import { SubmitProgressDto } from './dto/submit-progress.dto';
import { ProgressService } from './progress.service';

@Controller('progress')
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}

  @Post('submit')
  async submit(@Body() dto: SubmitProgressDto) {
    return await this.progress.submit(dto);
  }
}

