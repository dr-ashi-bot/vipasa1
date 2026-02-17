import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProfileEntity } from '../db/postgres/user-profile.entity';
import { UserService } from './user.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserProfileEntity])],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}

