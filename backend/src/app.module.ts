import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { BktModule } from './bkt/bkt.module';
import { ContentModule } from './content/content.module';
import { GamificationModule } from './gamification/gamification.module';
import { SessionModule } from './session/session.module';
import { VideoModule } from './video/video.module';
import { UserProfile } from './database/user-profile.entity';
import { BktMastery } from './database/bkt-mastery.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('POSTGRES_HOST', 'localhost'),
        port: config.get<number>('POSTGRES_PORT', 5432),
        username: config.get<string>('POSTGRES_USER', 'adaptive_user'),
        password: config.get<string>('POSTGRES_PASSWORD', 'adaptive_pass'),
        database: config.get<string>('POSTGRES_DB', 'adaptive_learning'),
        entities: [UserProfile, BktMastery],
        synchronize: config.get<string>('NODE_ENV', 'development') !== 'production',
        logging: config.get<string>('NODE_ENV', 'development') !== 'production',
      }),
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get(
          'MONGODB_URI',
          'mongodb://localhost:27017/adaptive_learning',
        ),
      }),
    }),

    EventEmitterModule.forRoot(),

    UserModule,
    BktModule,
    ContentModule,
    GamificationModule,
    SessionModule,
    VideoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
