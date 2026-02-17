import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfile } from './entities/user-profile.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserProfile)
    private readonly userRepo: Repository<UserProfile>,
  ) {}

  async create(dto: CreateUserDto): Promise<UserProfile> {
    const user = this.userRepo.create({
      first_name: dto.first_name ?? 'Ashi',
      thematic_interests: dto.thematic_interests ?? [
        'gymnastics',
        'cute puppies',
      ],
      math_level: dto.math_level ?? 6,
      ela_level: dto.ela_level ?? 4,
    });
    return this.userRepo.save(user);
  }

  async findById(userId: string): Promise<UserProfile> {
    const user = await this.userRepo.findOne({ where: { user_id: userId } });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }
    return user;
  }

  async updateLevels(
    userId: string,
    mathLevel?: number,
    elaLevel?: number,
  ): Promise<UserProfile> {
    const user = await this.findById(userId);
    if (mathLevel !== undefined) user.math_level = mathLevel;
    if (elaLevel !== undefined) user.ela_level = elaLevel;
    return this.userRepo.save(user);
  }

  async incrementSessionCount(userId: string): Promise<void> {
    await this.userRepo.increment(
      { user_id: userId },
      'total_sessions_completed',
      1,
    );
  }
}
