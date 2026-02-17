import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiController } from './api/api.controller';
import { BktService } from './bkt/bkt.service';
import { ContentService } from './content/content.service';
import { BktMastery } from './mastery/bkt-mastery.entity';
import { SessionService } from './session/session.service';
import { TutorService } from './tutor/tutor.service';
import { UserProfile } from './users/user-profile.entity';
import { UserProfileService } from './users/user-profile.service';
import { VectorMemoryService } from './vector/vector-memory.service';
import { ProgressService } from './progress/progress.service';
import { GamificationService } from './gamification/gamification.service';
import { GamificationEventsPublisher } from './gamification/gamification-events.publisher';
import { VideoService } from './video/video.service';

const postgresEnabled = process.env.POSTGRES_ENABLED === 'true';
const mongoEnabled = process.env.MONGO_ENABLED === 'true';
const persistenceImports = [
  ...(postgresEnabled
    ? [
        TypeOrmModule.forRoot({
          type: 'postgres',
          url:
            process.env.POSTGRES_URL ??
            'postgres://postgres:postgres@localhost:5432/adaptive_learning',
          entities: [UserProfile, BktMastery],
          synchronize: true,
          logging: false,
        }),
      ]
    : []),
  ...(mongoEnabled
    ? [
        MongooseModule.forRoot(
          process.env.MONGO_URI ?? 'mongodb://localhost:27017/adaptive_learning',
        ),
      ]
    : []),
];

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), ...persistenceImports],
  controllers: [ApiController],
  providers: [
    UserProfileService,
    SessionService,
    BktService,
    VectorMemoryService,
    TutorService,
    ContentService,
    ProgressService,
    GamificationService,
    GamificationEventsPublisher,
    VideoService,
  ],
})
export class AppModule {}
