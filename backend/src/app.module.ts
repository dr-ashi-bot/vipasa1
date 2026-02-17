import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';

import { UserModule } from './user/user.module';
import { BKTModule } from './bkt/bkt.module';
import { ContentModule } from './content/content.module';
import { GamificationModule } from './gamification/gamification.module';
import { SessionModule } from './session/session.module';
import { VideoModule } from './video/video.module';

import { UserProfile } from './user/entities/user-profile.entity';
import { BKTMastery } from './bkt/entities/bkt-mastery.entity';

@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // PostgreSQL (relational user data, curriculum mapping, BKT mastery)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('POSTGRES_HOST', 'localhost'),
        port: parseInt(config.get('POSTGRES_PORT', '5432'), 10),
        username: config.get('POSTGRES_USER', 'ashi_app'),
        password: config.get('POSTGRES_PASSWORD', 'change_me'),
        database: config.get('POSTGRES_DB', 'adaptive_learning'),
        entities: [UserProfile, BKTMastery],
        synchronize: true, // Auto-migrate in dev; disable in production
        logging: false,
      }),
    }),

    // MongoDB (high-throughput gamification events, XP ledgers)
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get(
          'MONGODB_URI',
          'mongodb://localhost:27017/adaptive_learning_gamification',
        ),
      }),
    }),

    // Feature modules
    UserModule,
    BKTModule,
    ContentModule,
    GamificationModule,
    SessionModule,
    VideoModule,
  ],
})
export class AppModule {}
