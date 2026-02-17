import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { UserModule } from '../user/user.module';
import { BKTModule } from '../bkt/bkt.module';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [ConfigModule, UserModule, BKTModule, GamificationModule],
  controllers: [SessionController],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
