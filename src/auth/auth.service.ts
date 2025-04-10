import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async signUp(data: {
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
  }) {
    //check if user already exists
    const existingUser = await this.usersService.findByEmail(data.email);
    if (existingUser) {
      throw new UnauthorizedException('User with this email already exists')
    }

    //Hash the password 
    const hashedPassword = await bcrypt.hash(data.password, 10);

    //create user with hashed password
    const user = await this.usersService.create({
      ...data,
      password: hashedPassword,
    });

    //remove password from response
    const {password, ...result } = user;
    return result; 
  }
}