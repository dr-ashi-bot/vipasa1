import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BktModule } from './bkt/bkt.module';
import { ContentModule } from './content/content.module';
import { GamificationModule } from './gamification/gamification.module';
import { MemoryModule } from './memory/memory.module';
import { SessionModule } from './session/session.module';
import { ProgressModule } from './progress/progress.module';
import { VideoModule } from './video/video.module';
import { EventsModule } from './events/events.module';
import { UserProfile } from './entities/user-profile.entity';
import { BKTMastery } from './entities/bkt-mastery.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.PG_HOST ?? 'localhost',
      port: parseInt(process.env.PG_PORT ?? '5432', 10),
      username: process.env.PG_USER ?? 'postgres',
      password: process.env.PG_PASSWORD ?? 'postgres',
      database: process.env.PG_DB ?? 'adaptive_learning',
      entities: [UserProfile, BKTMastery],
      synchronize: true,
    }),
    MongooseModule.forRoot(
      process.env.MONGO_URI ?? 'mongodb://localhost:27017/adaptive_learning',
    ),
    EventsModule,
    BktModule,
    ContentModule,
    GamificationModule,
    MemoryModule,
    SessionModule,
    ProgressModule,
    VideoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
