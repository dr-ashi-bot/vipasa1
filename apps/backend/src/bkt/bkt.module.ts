import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BktMasteryEntity } from '../db/postgres/bkt-mastery.entity';
import { BktService } from './bkt.service';

@Module({
  imports: [TypeOrmModule.forFeature([BktMasteryEntity])],
  providers: [BktService],
  exports: [BktService],
})
export class BktModule {}

