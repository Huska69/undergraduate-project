// src/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Protected route: Get all users (profile)
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile() {
    return this.usersService.findAll();
  }

  // this shouldnt be public. user creation should happen through auth/signup
  // @Post()
  // async create(@Body() data: {...}) 

  // Protected route: Get a specific user by ID
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // Protected route: Update a user by ID 
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body()
    data: { 
      firstName: string;
      lastName: string;
      nationality: string;
      age?: number; // 👈 Make optional
      sex: string;
      pregnancy?: string;
      height?: number; // 👈 Make optional
      weight?: number; // 👈 Make optional
      contact?: number; // 👈 Make optional
      blood?: string; // 👈 Make optional
      allergies?: string; // 👈 Make optional
      medCond?: string; // 👈 Make optional
      meds?: string; // 👈 Make optional
      email: string;
      password: string;
  },
  ) {
    return this.usersService.update(id, data)
  }

  // Protected route: Delete a user by ID
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
