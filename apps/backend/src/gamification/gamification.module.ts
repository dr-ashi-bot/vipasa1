import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GamificationState, GamificationStateSchema } from '../db/mongo/gamification-state.schema';
import { XpEvent, XpEventSchema } from '../db/mongo/xp-event.schema';
import { MessagingModule } from '../infra/messaging/rabbitmq.module';
import { GamificationConsumer } from './gamification.consumer';
import { GamificationController } from './gamification.controller';
import { GamificationService } from './gamification.service';

@Module({
  imports: [
    MessagingModule,
    MongooseModule.forFeature([
      { name: GamificationState.name, schema: GamificationStateSchema },
      { name: XpEvent.name, schema: XpEventSchema },
    ]),
  ],
  controllers: [GamificationController],
  providers: [GamificationService, GamificationConsumer],
  exports: [GamificationService],
})
export class GamificationModule {}

