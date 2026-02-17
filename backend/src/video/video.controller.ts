import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VideoService } from './video.service';
import { VerifyVideoDto } from './dto/verify-video.dto';

@ApiTags('Video')
@Controller('api/video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  /**
   * POST /api/video/verify
   * Receives watch_duration_sec from YouTube getCurrentTime() payload
   * to validate completion and issue XP rewards.
   */
  @Post('verify')
  @ApiOperation({
    summary: 'Verify video completion and award XP',
    description:
      'Anti-cheat verification using YouTube API callbacks. ' +
      'Checks: >=90% watched, normal playback speed, consistent timing. ' +
      'Awards XP and triggers confetti only if all checks pass.',
  })
  @ApiResponse({
    status: 201,
    description: 'Video verification result with XP reward',
  })
  async verifyVideo(@Body() dto: VerifyVideoDto) {
    return this.videoService.verifyAndReward(dto);
  }

  /**
   * GET /api/video/recommendations/:conceptId
   */
  @Get('recommendations/:conceptId')
  @ApiOperation({ summary: 'Get Khan Academy video recommendations' })
  getRecommendations(@Param('conceptId') conceptId: string) {
    return this.videoService.getVideoRecommendations(conceptId);
  }
}
