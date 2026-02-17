import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { SessionModule } from './modules/session/session.module';
import { ContentModule } from './modules/content/content.module';
import { ProgressModule } from './modules/progress/progress.module';
import { VideoModule } from './modules/video/video.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { UserModule } from './modules/user/user.module';
import { RabbitMQModule } from './modules/rabbitmq/rabbitmq.module';
import { VectorDbModule } from './modules/vector-db/vector-db.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // PostgreSQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('POSTGRES_HOST', 'localhost'),
        port: configService.get('POSTGRES_PORT', 5432),
        username: configService.get('POSTGRES_USER', 'postgres'),
        password: configService.get('POSTGRES_PASSWORD', 'postgres'),
        database: configService.get('POSTGRES_DB', 'adaptive_learning'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // Set to false in production
        logging: false,
      }),
    }),

    // MongoDB
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get(
          'MONGODB_URI',
          'mongodb://admin:admin@localhost:27017/gamification?authSource=admin',
        ),
      }),
    }),

    // Feature Modules
    RabbitMQModule,
    VectorDbModule,
    UserModule,
    SessionModule,
    ContentModule,
    ProgressModule,
    VideoModule,
    GamificationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
