import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import {
  GamificationState,
  GamificationStateSchema,
} from './schemas/gamification-state.schema';
import { XPEvent, XPEventSchema } from './schemas/xp-event.schema';
import {
  Leaderboard,
  LeaderboardSchema,
} from './schemas/leaderboard.schema';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';
import { BKTModule } from '../bkt/bkt.module';
import { ContentModule } from '../content/content.module';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: GamificationState.name, schema: GamificationStateSchema },
      { name: XPEvent.name, schema: XPEventSchema },
      { name: Leaderboard.name, schema: LeaderboardSchema },
    ]),
    BKTModule,
    forwardRef(() => ContentModule),
  ],
  controllers: [GamificationController],
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule {}
