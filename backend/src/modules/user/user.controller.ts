import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { UserProfileEntity } from './entities/user-profile.entity';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getAllUsers() {
    return this.userService.getAllUsers();
  }

  @Get(':user_id')
  async getUser(@Param('user_id') user_id: string) {
    return this.userService.findById(user_id);
  }

  @Post()
  async createUser(@Body() data: Partial<UserProfileEntity>) {
    return this.userService.createUser(data);
  }

  @Put(':user_id')
  async updateUser(@Param('user_id') user_id: string, @Body() data: Partial<UserProfileEntity>) {
    return this.userService.updateUser(user_id, data);
  }
}
