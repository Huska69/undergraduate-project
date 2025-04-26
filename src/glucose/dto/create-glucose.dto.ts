import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateGlucoseDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsNumber()
  @IsNotEmpty()
  value: number;

  timestamp?: number; // Optional timestamp from device
}

// src/glucose/dto/glucose-response.dto.ts
export class GlucoseResponseDto {
  id: string;
  userId: string;
  value: number;
  createdAt: Date;
}