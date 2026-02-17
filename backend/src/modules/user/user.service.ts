import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfileEntity } from './entities/user-profile.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserProfileEntity)
    private userProfileRepository: Repository<UserProfileEntity>,
  ) {}

  async findById(user_id: string): Promise<UserProfileEntity> {
    const user = await this.userProfileRepository.findOne({ where: { user_id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${user_id} not found`);
    }
    return user;
  }

  async createUser(data: Partial<UserProfileEntity>): Promise<UserProfileEntity> {
    const user = this.userProfileRepository.create({
      user_id: uuidv4(),
      first_name: data.first_name || 'Ashi',
      thematic_interests: data.thematic_interests || ['gymnastics', 'cute puppies'],
      math_level: data.math_level || 6,
      ela_level: data.ela_level || 4,
    });
    return this.userProfileRepository.save(user);
  }

  async updateUser(user_id: string, data: Partial<UserProfileEntity>): Promise<UserProfileEntity> {
    await this.userProfileRepository.update(user_id, data);
    return this.findById(user_id);
  }

  async getAllUsers(): Promise<UserProfileEntity[]> {
    return this.userProfileRepository.find();
  }
}
