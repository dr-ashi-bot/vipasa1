import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BKTMastery } from "../entities/bkt-mastery.entity";
import { UserProfile } from "../entities/user-profile.entity";
import { LearningController } from "./learning.controller";
import { AiTutorService } from "./services/ai-tutor.service";
import { BktService } from "./services/bkt.service";
import { CurriculumService } from "./services/curriculum.service";
import { GamificationService } from "./services/gamification.service";
import { RabbitMqService } from "./services/rabbitmq.service";
import { SessionService } from "./services/session.service";
import {
  GamificationState,
  GamificationStateSchema,
} from "./schemas/gamification-state.schema";
import { XpLedgerEvent, XpLedgerEventSchema } from "./schemas/xp-ledger-event.schema";
import { VectorMemoryService } from "./services/vector-memory.service";
import { VideoVerificationService } from "./services/video-verification.service";

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([UserProfile, BKTMastery]),
    MongooseModule.forFeature([
      { name: GamificationState.name, schema: GamificationStateSchema },
      { name: XpLedgerEvent.name, schema: XpLedgerEventSchema },
    ]),
  ],
  controllers: [LearningController],
  providers: [
    SessionService,
    CurriculumService,
    BktService,
    VectorMemoryService,
    AiTutorService,
    GamificationService,
    RabbitMqService,
    VideoVerificationService,
  ],
})
export class LearningModule {}
