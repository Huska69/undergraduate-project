// signup.dto.ts
import { IsOptional, IsEmail, IsString, MinLength, IsNumber, IsBoolean, Validate } from 'class-validator';
import { Match } from './match.decorator';

export class SignUpDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @Validate(Match, ['password']) // Ensure confirmPassword matches password
  confirmPassword: string;

  @IsString()
  name: string;

  @IsNumber()
  @IsOptional() // 👈 Make age optional
  age?: number;

  @IsString()
  sex: string;

  @IsBoolean()
  @IsOptional() // 👈 Make pregnancy optional
  pregnancy?: boolean;

  // Make these fields optional
  @IsNumber()
  @IsOptional()
  height?: number;

  @IsNumber()
  @IsOptional()
  weight?: number;

  @IsNumber()
  @IsOptional()
  contact?: number;

  @IsString()
  @IsOptional()
  blood?: string;

  @IsString()
  @IsOptional()
  allergies?: string;

  @IsString()
  @IsOptional()
  medCond?: string;

  @IsString()
  @IsOptional()
  meds?: string;
}