import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

export class BulkGlucoseApiKeyDto {
  @IsString()
  @IsNotEmpty()
  apiKey: string; // API key for device authentication

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GlucoseReadingDto)
  readings: GlucoseReadingDto[];
}