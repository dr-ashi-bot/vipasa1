import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GamificationState, GamificationStateSchema } from './schemas/gamification-state.schema';
import { Quest, QuestSchema, UserQuest, UserQuestSchema } from './schemas/quest.schema';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';
import { LeagueService } from './league.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GamificationState.name, schema: GamificationStateSchema },
      { name: Quest.name, schema: QuestSchema },
      { name: UserQuest.name, schema: UserQuestSchema },
    ]),
  ],
  controllers: [GamificationController],
  providers: [GamificationService, LeagueService],
  exports: [GamificationService, LeagueService],
})
export class GamificationModule {}
