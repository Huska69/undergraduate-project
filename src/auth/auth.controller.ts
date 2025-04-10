import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signUp(
    @Body()
    data: {
      name: string;
      age: number;
      sex: string;
      pregnancy?: boolean;
      height: number;
      weight: number;
      contact: number;
      blood: string;
      allergies: string;
      medCond: string;
      meds: string;
      email: string;
      password: string;
    },
  ) {
    return this.authService.signUp(data);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }
}