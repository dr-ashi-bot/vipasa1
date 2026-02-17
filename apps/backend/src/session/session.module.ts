import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearningSessionEntity } from '../db/postgres/learning-session.entity';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { UserModule } from '../user/user.module';
import { BktModule } from '../bkt/bkt.module';
import { CurriculumModule } from '../curriculum/curriculum.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LearningSessionEntity]),
    UserModule,
    BktModule,
    CurriculumModule,
  ],
  controllers: [SessionController],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}

