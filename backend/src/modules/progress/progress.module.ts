import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BKTMasteryEntity } from './entities/bkt-mastery.entity';
import { ConceptEntity } from './entities/concept.entity';
import { ProgressService } from './progress.service';
import { BKTEngine } from './bkt-engine.service';
import { ProgressController } from './progress.controller';
import { GamificationModule } from '../gamification/gamification.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BKTMasteryEntity, ConceptEntity]),
    GamificationModule,
    UserModule,
  ],
  controllers: [ProgressController],
  providers: [ProgressService, BKTEngine],
  exports: [ProgressService, BKTEngine],
})
export class ProgressModule {}
