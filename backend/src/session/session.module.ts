import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { ProgressController } from './progress.controller';
import { BktModule } from '../bkt/bkt.module';
import { GamificationModule } from '../gamification/gamification.module';
import { ContentModule } from '../content/content.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [BktModule, GamificationModule, ContentModule, UserModule],
  controllers: [SessionController, ProgressController],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
