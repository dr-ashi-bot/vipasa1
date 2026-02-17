import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfile } from '../database/user-profile.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserProfile)
    private readonly userRepo: Repository<UserProfile>,
  ) {}

  async createUser(
    firstName = 'Ashi',
    interests: string[] = ['gymnastics', 'cute puppies'],
  ): Promise<UserProfile> {
    const user = this.userRepo.create({
      first_name: firstName,
      thematic_interests: interests,
      math_level: 6,
      ela_level: 4,
    });
    return this.userRepo.save(user);
  }

  async getUserById(userId: string): Promise<UserProfile> {
    const user = await this.userRepo.findOne({
      where: { user_id: userId },
      relations: ['masteries'],
    });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }
    return user;
  }

  async updateUser(
    userId: string,
    updates: Partial<UserProfile>,
  ): Promise<UserProfile> {
    await this.userRepo.update(userId, updates);
    return this.getUserById(userId);
  }
}
