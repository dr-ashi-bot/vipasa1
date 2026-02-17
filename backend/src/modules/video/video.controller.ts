import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { VideoService, VideoVerificationDto } from './video.service';

@Controller('video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post('verify')
  async verifyCompletion(@Body() dto: VideoVerificationDto) {
    return this.videoService.verifyVideoCompletion(dto);
  }

  @Get('recommended/:concept_id')
  async getRecommendedVideos(@Param('concept_id') concept_id: string) {
    const videos = await this.videoService.getRecommendedVideos(concept_id);
    return { videos };
  }
}
