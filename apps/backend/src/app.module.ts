import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BKTMastery } from "./entities/bkt-mastery.entity";
import { UserProfile } from "./entities/user-profile.entity";
import { LearningModule } from "./learning/learning.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../../.env"],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: "postgres" as const,
        host: configService.get<string>("POSTGRES_HOST", "localhost"),
        port: configService.get<number>("POSTGRES_PORT", 5432),
        username: configService.get<string>("POSTGRES_USER", "vipasa"),
        password: configService.get<string>("POSTGRES_PASSWORD", "vipasa"),
        database: configService.get<string>("POSTGRES_DB", "vipasa"),
        entities: [UserProfile, BKTMastery],
        synchronize: true,
      }),
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>("MONGO_URI", "mongodb://localhost:27017/vipasa"),
      }),
    }),
    LearningModule,
  ],
})
export class AppModule {}
