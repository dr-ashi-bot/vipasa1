import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VideoService } from './video.service';
import { VideoController } from './video.controller';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [ConfigModule, GamificationModule],
  controllers: [VideoController],
  providers: [VideoService],
  exports: [VideoService],
})
export class VideoModule {}
