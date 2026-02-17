import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BKTMastery } from './entities/bkt-mastery.entity';
import { BKTService } from './bkt.service';

@Module({
  imports: [TypeOrmModule.forFeature([BKTMastery])],
  providers: [BKTService],
  exports: [BKTService],
})
export class BKTModule {}
