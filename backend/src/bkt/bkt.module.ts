import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BktService } from './bkt.service';
import { BKTMastery } from '../entities/bkt-mastery.entity';
import { UserProfile } from '../entities/user-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([BKTMastery, UserProfile]),
  ],
  providers: [BktService],
  exports: [BktService],
})
export class BktModule {}
