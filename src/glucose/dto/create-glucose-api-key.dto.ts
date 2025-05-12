import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateGlucoseApiKeyDto {
  @IsString()
  @IsNotEmpty()
  apiKey: string; // API key for device authentication

  @IsNumber()
  @IsNotEmpty()
  @Min(0)    // Minimum realistic glucose value (mg/dL)
  @Max(1000) // Maximum realistic glucose value (mg/dL)
  value: number;

  @IsNumber()
  @IsOptional()
  timestamp?: number; // Optional timestamp from device (milliseconds since epoch)
}