import { Module } from '@nestjs/common';
import { MessagingModule } from '../infra/messaging/rabbitmq.module';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';

@Module({
  imports: [MessagingModule],
  controllers: [VideoController],
  providers: [VideoService],
})
export class VideoModule {}

