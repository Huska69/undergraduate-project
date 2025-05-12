import { IsNotEmpty, IsString } from 'class-validator';

export class ApiKeyDto {
  @IsString()
  @IsNotEmpty()
  apiKey: string;
}