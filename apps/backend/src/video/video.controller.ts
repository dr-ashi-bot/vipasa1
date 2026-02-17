import { Body, Controller, Post } from '@nestjs/common';
import { VerifyVideoDto } from './dto/verify-video.dto';
import { VideoService } from './video.service';

@Controller('video')
export class VideoController {
  constructor(private readonly videos: VideoService) {}

  @Post('verify')
  async verify(@Body() dto: VerifyVideoDto) {
    return await this.videos.verify(dto);
  }
}

