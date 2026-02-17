import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { BktModule } from '../bkt/bkt.module';
import { UserProfile } from '../entities/user-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserProfile]), BktModule],
  controllers: [SessionController],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
