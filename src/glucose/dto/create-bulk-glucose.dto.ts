import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';

class GlucoseReadingDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(0)    // Minimum realistic glucose value (mg/dL)
  @Max(1000) // Maximum realistic glucose value (mg/dL)
  value: number;

  @IsNumber()
  @IsOptional()
  timestamp?: number; // Optional timestamp from device
}

export class CreateBulkGlucoseDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GlucoseReadingDto)
  readings: GlucoseReadingDto[];
}