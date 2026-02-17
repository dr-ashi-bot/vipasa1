import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UserService } from './user.service';

@ApiTags('users')
@Controller('api/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user profile' })
  async createUser(
    @Body() body: { first_name?: string; thematic_interests?: string[] },
  ) {
    return this.userService.createUser(
      body.first_name,
      body.thematic_interests,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user profile by ID' })
  async getUser(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }
}
