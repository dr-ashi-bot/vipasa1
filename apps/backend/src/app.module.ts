import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as path from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InfraModule } from './infra/infra.module';
import { BktModule } from './bkt/bkt.module';
import { ContentModule } from './content/content.module';
import { CurriculumModule } from './curriculum/curriculum.module';
import { GamificationModule } from './gamification/gamification.module';
import { ProgressModule } from './progress/progress.module';
import { SessionModule } from './session/session.module';
import { UserModule } from './user/user.module';
import { VideoModule } from './video/video.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.resolve(process.cwd(), '.env'),
        path.resolve(process.cwd(), '../../.env'),
      ],
    }),
    ...(process.env.DISABLE_INFRA === 'true' || process.env.NODE_ENV === 'test'
      ? []
      : [
          InfraModule,
          UserModule,
          BktModule,
          CurriculumModule,
          SessionModule,
          ContentModule,
          ProgressModule,
          VideoModule,
          GamificationModule,
        ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
