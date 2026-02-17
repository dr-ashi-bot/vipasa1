import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModule } from '../ai/ai.module';
import { BktModule } from '../bkt/bkt.module';
import { GeneratedContentEntity } from '../db/postgres/generated-content.entity';
import { MessagingModule } from '../infra/messaging/rabbitmq.module';
import { VectorModule } from '../infra/vector/vector.module';
import { SessionModule } from '../session/session.module';
import { UserModule } from '../user/user.module';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([GeneratedContentEntity]),
    UserModule,
    SessionModule,
    BktModule,
    AiModule,
    VectorModule,
    MessagingModule,
  ],
  controllers: [ProgressController],
  providers: [ProgressService],
})
export class ProgressModule {}

