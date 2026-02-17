import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';
import {
  GamificationState,
  GamificationStateSchema,
} from '../database/gamification-state.schema';
import { XpEvent, XpEventSchema } from '../database/xp-event.schema';
import { GamificationService } from './gamification.service';
import { GamificationEventHandler } from './gamification.event-handler';
import { LeagueService } from './league.service';
import { QuestService } from './quest.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GamificationState.name, schema: GamificationStateSchema },
      { name: XpEvent.name, schema: XpEventSchema },
    ]),
    EventEmitterModule.forRoot(),
  ],
  providers: [
    GamificationService,
    GamificationEventHandler,
    LeagueService,
    QuestService,
  ],
  exports: [GamificationService, LeagueService, QuestService],
})
export class GamificationModule {}
