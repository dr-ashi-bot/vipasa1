import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  GamificationState,
  GamificationStateSchema,
} from '../schemas/gamification-state.schema';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';
import { QuestService } from './quest.service';
import { GamificationListener } from '../events/gamification.listener';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    EventsModule,
    MongooseModule.forFeature([
      { name: GamificationState.name, schema: GamificationStateSchema },
    ]),
  ],
  controllers: [GamificationController],
  providers: [GamificationService, QuestService, GamificationListener],
  exports: [GamificationService, QuestService],
})
export class GamificationModule {}
