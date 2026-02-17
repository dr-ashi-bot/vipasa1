import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BktMastery } from '../database/bkt-mastery.entity';
import { BktService } from './bkt.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([BktMastery]), UserModule],
  providers: [BktService],
  exports: [BktService],
})
export class BktModule {}
