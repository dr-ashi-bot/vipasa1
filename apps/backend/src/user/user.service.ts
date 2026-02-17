import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfileEntity } from '../db/postgres/user-profile.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserProfileEntity)
    private readonly userRepo: Repository<UserProfileEntity>,
  ) {}

  async getOrCreateUser(user_id: string): Promise<UserProfileEntity> {
    const existing = await this.userRepo.findOne({ where: { user_id } });
    if (existing) return existing;
    const created = this.userRepo.create({ user_id });
    return await this.userRepo.save(created);
  }
}

