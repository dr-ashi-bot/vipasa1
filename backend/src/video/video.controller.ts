import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { VideoService, VideoVerification } from './video.service';

class VerifyVideoDto {
  user_id: string;
  video_id: string;
  video_duration_sec: number;
  watch_duration_sec: number;
  start_time: number;
  end_time: number;
}

@ApiTags('video')
@Controller('api/video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Verify video completion and award XP (anti-cheat: 90% watch required)',
  })
  @ApiBody({ type: VerifyVideoDto })
  async verifyVideo(@Body() body: VerifyVideoDto) {
    return this.videoService.verifyVideoCompletion(body as VideoVerification);
  }

  @Get('recommendations/:conceptId')
  @ApiOperation({
    summary: 'Get Khan Academy video recommendations for a concept',
  })
  async getRecommendations(@Param('conceptId') conceptId: string) {
    return this.videoService.getVideoRecommendations(conceptId);
  }
}
