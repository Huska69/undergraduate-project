// dto/create-glucose.dto.ts
import { IsNumber, IsOptional, IsDate } from 'class-validator';

export class CreateGlucoseDto {
  @IsNumber()
  value: number;

  @IsOptional()
  @IsDate()
  timestamp?: Date;
}